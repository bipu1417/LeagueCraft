import React, { useEffect, useState } from "react";
import { CheckCircle2, ShieldAlert, XCircle } from "lucide-react";
import { collection, db, doc, onSnapshot, setDoc, Timestamp } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { DEFAULT_SUBSCRIPTION_PLAN_ID, formatValidity, getSubscriptionPlan } from "../config/subscriptionPlans";
import { notifySafely } from "../utils/notificationService";

export default function SubscriptionApprovals() {
  const { user, isCreator } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [rejectReasons, setRejectReasons] = useState({});

  useEffect(() => {
    if (!isCreator) {
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onSnapshot(
      collection(db, "subscriptionRequests"),
      (snapshot) => {
        const list = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter((item) => item.status === "pending")
          .sort((a, b) => {
            const left = a.submittedAt?.toDate ? a.submittedAt.toDate().getTime() : 0;
            const right = b.submittedAt?.toDate ? b.submittedAt.toDate().getTime() : 0;
            return right - left;
          });

        setRequests(list);
        setLoading(false);
      },
      (error) => {
        console.error("Subscription approvals listener failed:", error);
        setMessage(error.code === "permission-denied"
          ? "Only the application creator can view subscription approvals."
          : error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isCreator]);

  const approveRequest = async (request) => {
    setMessage("");
    const selectedPlan = getSubscriptionPlan(request.planId || DEFAULT_SUBSCRIPTION_PLAN_ID);
    const validityDays = Number(request.validityDays || selectedPlan.validityDays);
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validityDays);

    const subscription = {
      status: "active",
      paymentStatus: "paid",
      plan: request.plan || selectedPlan.plan,
      planId: selectedPlan.id,
      paymentRefNo: request.paymentRefNo,
      paymentMode: request.paymentMode || "upi",
      amount: request.amount || selectedPlan.amount,
      currency: request.currency || "INR",
      validityDays,
      validUntil: Timestamp.fromDate(validUntil),
      approvedAt: new Date(),
      approvedBy: user.email,
    };

    try {
      await setDoc(
        doc(db, "users", request.userId),
        {
          email: request.userEmail,
          role: "admin",
          subscription,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      await setDoc(
        doc(db, "subscriptionRequests", request.id),
        {
          ...request,
          status: "approved",
          paymentStatus: "paid",
          validityDays,
          planId: selectedPlan.id,
          validUntil: Timestamp.fromDate(validUntil),
          approvedAt: new Date(),
          approvedBy: user.email,
        },
        { merge: true }
      );

      await notifySafely({
        type: "subscription_request_approved",
        recipientRole: "user",
        recipientUserId: request.userId,
        recipientEmail: request.userEmail,
        recipientPhone: request.contactPhone,
        title: "Subscription approved",
        message: `Your ${selectedPlan.name} subscription is approved. Organizer access is active until ${validUntil.toLocaleString()}.`,
        metadata: {
          userId: request.userId,
          planId: selectedPlan.id,
          validUntil: validUntil.toISOString(),
        },
        senderId: user.uid,
        senderEmail: user.email,
      });

      setMessage(`${request.userEmail} approved successfully.`);
    } catch (error) {
      console.error("Approval failed:", error);
      setMessage(error.message);
    }
  };

  const rejectRequest = async (request) => {
    const rejectionReason = (rejectReasons[request.id] || "").trim();
    if (!rejectionReason) {
      setMessage("Please enter a rejection reason before rejecting the request.");
      return;
    }

    setMessage("");

    const subscription = {
      status: "rejected",
      paymentStatus: "rejected",
      plan: request.plan || getSubscriptionPlan(request.planId).plan,
      planId: request.planId || DEFAULT_SUBSCRIPTION_PLAN_ID,
      paymentRefNo: request.paymentRefNo,
      paymentMode: request.paymentMode || "upi",
      amount: request.amount || getSubscriptionPlan(request.planId).amount,
      currency: request.currency || "INR",
      rejectionReason,
      rejectedAt: new Date(),
      rejectedBy: user.email,
    };

    try {
      await setDoc(
        doc(db, "users", request.userId),
        {
          email: request.userEmail,
          role: "user",
          subscription,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      await setDoc(
        doc(db, "subscriptionRequests", request.id),
        {
          ...request,
          status: "rejected",
          paymentStatus: "rejected",
          rejectionReason,
          rejectedAt: new Date(),
          rejectedBy: user.email,
        },
        { merge: true }
      );

      await notifySafely({
        type: "subscription_request_rejected",
        recipientRole: "user",
        recipientUserId: request.userId,
        recipientEmail: request.userEmail,
        recipientPhone: request.contactPhone,
        title: "Subscription rejected",
        message: `Your subscription request was rejected. Reason: ${rejectionReason}`,
        metadata: {
          userId: request.userId,
          planId: request.planId || DEFAULT_SUBSCRIPTION_PLAN_ID,
          rejectionReason,
        },
        senderId: user.uid,
        senderEmail: user.email,
      });

      setRejectReasons((current) => {
        const next = { ...current };
        delete next[request.id];
        return next;
      });
      setMessage(`${request.userEmail} rejected. They can submit corrected payment details again.`);
    } catch (error) {
      console.error("Rejection failed:", error);
      setMessage(error.message);
    }
  };

  if (!isCreator) {
    return (
      <div className="mx-auto max-w-xl rounded-lg border border-red-400/30 bg-red-500/10 p-6 text-center text-red-100">
        <ShieldAlert className="mx-auto mb-3" />
        Only desiindianboyz@gmail.com can approve premium subscriptions.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-0 py-4 text-white sm:px-4 sm:py-8">
      <div className="surface rounded-lg p-4 sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-yellow-200">Creator approval</p>
        <h1 className="safe-text mt-1 text-2xl font-bold sm:text-3xl">Subscription Verifications</h1>
        <p className="mt-2 text-gray-300">Approve valid UPI requests or reject invalid payment details so users can resubmit.</p>

        {message && (
          <p className="mt-4 rounded-md border border-white/10 bg-white/5 p-3 text-sm text-yellow-100">{message}</p>
        )}

        {loading ? (
          <p className="mt-6 text-gray-300">Loading requests...</p>
        ) : requests.length === 0 ? (
          <p className="mt-6 text-gray-300">No pending subscription verifications.</p>
        ) : (
          <div className="mt-6 space-y-3">
            {requests.map((request) => (
              <div key={request.id} className="rounded-lg border border-white/10 bg-gray-950/70 p-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] lg:items-start">
                  <div className="min-w-0">
                    <p className="break-all font-semibold text-white">{request.userEmail}</p>
                    <p className="break-all text-sm text-gray-400">UPI Ref: {request.paymentRefNo}</p>
                    <p className="text-sm text-gray-400">Plan: {getSubscriptionPlan(request.planId).name}</p>
                    <p className="text-sm text-gray-400">Amount: Rs. {request.amount || getSubscriptionPlan(request.planId).amount}</p>
                    <p className="text-sm text-gray-400">Validity: {formatValidity(request.validityDays || getSubscriptionPlan(request.planId).validityDays)}</p>
                    {request.contactPhone && (
                      <p className="break-all text-sm text-gray-400">Phone: {request.contactPhone}</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={() => approveRequest(request)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-green-400 px-4 py-2 font-semibold text-gray-950 hover:bg-green-300"
                    >
                      <CheckCircle2 size={18} />
                      Approve & Make Admin
                    </button>
                    <textarea
                      value={rejectReasons[request.id] || ""}
                      onChange={(event) =>
                        setRejectReasons((current) => ({ ...current, [request.id]: event.target.value }))
                      }
                      rows="2"
                      placeholder="Rejection reason, e.g. invalid UTR or payment not received"
                      className="input-surface w-full rounded-md px-3 py-2 text-sm"
                    />
                    <button
                      onClick={() => rejectRequest(request)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-400"
                    >
                      <XCircle size={18} />
                      Reject Request
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
