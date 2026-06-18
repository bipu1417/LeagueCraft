import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Copy, QrCode, ShieldCheck, Smartphone } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import upiQr from "../assets/299.png";
import { DEFAULT_SUBSCRIPTION_PLAN_ID, formatValidity, getSubscriptionPlan } from "../config/subscriptionPlans";

const UPI_ID = "8972089184@pthdfc";
const UPI_NAME = "LeagueCraft";
const isUpiDeepLinkConfigured = UPI_ID !== "merchant-upi-id@upi";

const buildUpiUrl = (plan) => {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: UPI_NAME,
    am: String(plan.amount),
    cu: "INR",
    tn: `LeagueCraft ${plan.name} - ${formatValidity(plan.validityDays)}`,
  });

  return `upi://pay?${params.toString()}`;
};

export default function Subscription() {
  const {
    profile,
    isSubscribed,
    isSubscriptionPending,
    isSubscriptionRejected,
    isSubscriptionExpired,
    subscriptionExpiresAt,
    subscriptionDaysRemaining,
    submitSubscriptionForApproval,
  } = useAuth();
  const navigate = useNavigate();
  const selectedPlan = getSubscriptionPlan(DEFAULT_SUBSCRIPTION_PLAN_ID);
  const [paymentRefNo, setPaymentRefNo] = useState("");
  const [contactPhone, setContactPhone] = useState(profile?.subscription?.contactPhone || profile?.phone || "");
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const upiUrl = buildUpiUrl(selectedPlan);

  const handleActivate = async (event) => {
    event.preventDefault();
    if (!paymentStarted) {
      setMessage("Pay using UPI first, then enter the successful transaction reference.");
      return;
    }

    if (!paymentRefNo.trim()) {
      setMessage("Enter the successful UPI transaction or UTR reference number.");
      return;
    }

    if (!contactPhone.trim()) {
      setMessage("Enter your WhatsApp or phone number so approval updates can reach you.");
      return;
    }

    setProcessing(true);
    setMessage("");
    try {
      await submitSubscriptionForApproval({
        paymentRefNo: paymentRefNo.trim(),
        paymentMode: "upi",
        amount: selectedPlan.amount,
        plan: selectedPlan.plan,
        planId: selectedPlan.id,
        validityDays: selectedPlan.validityDays,
        contactPhone: contactPhone.trim(),
      });
      setPaymentRefNo("");
      setMessage("Payment submitted. Pending verification from the application creator.");
      navigate("/profile");
    } catch (error) {
      console.error("Subscription activation failed:", error);
      setMessage(error.code === "permission-denied"
        ? "Payment could not be activated because Firestore rules are not deployed yet."
        : error.message);
    } finally {
      setProcessing(false);
    }
  };

  const copyUpiId = async () => {
    await navigator.clipboard.writeText(UPI_ID);
    setMessage("UPI ID copied.");
  };

  return (
    <div className="min-h-[75vh] px-0 py-4 text-white sm:px-4 sm:py-10">
      <div className="surface mx-auto max-w-5xl rounded-lg p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-yellow-200">UPI payment</p>
            <h1 className="safe-text mt-1 text-2xl font-bold text-white sm:text-3xl">Organizer Subscription</h1>
            <p className="text-gray-300 mt-3 max-w-2xl">
              {isSubscriptionExpired
                ? "Your premium access has expired. Renew with UPI to restore organizer tools."
                : "Pay with UPI. Once your transaction is successful, submit the UTR/reference number to unlock admin access."}
            </p>
          </div>
          <div className="rounded-lg border border-yellow-300/30 bg-yellow-300/10 px-5 py-4 text-left sm:text-right">
            <p className="text-sm text-yellow-100">{selectedPlan.name}</p>
            <p className="text-2xl font-black text-yellow-200 sm:text-3xl">Rs. {selectedPlan.amount}</p>
            <p className="mt-1 text-sm font-semibold text-green-200">Validity: {formatValidity(selectedPlan.validityDays)}</p>
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-3 gap-3 text-sm">
          {[...selectedPlan.features, `${formatValidity(selectedPlan.validityDays)} premium access`].map((item, index) => (
            <div key={item} className="rounded-md bg-gray-950/70 border border-white/10 p-4 text-yellow-100">
              <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-yellow-400 text-gray-950">
                {index + 1}
              </span>
              <p>{item}</p>
            </div>
          ))}
        </div>

        {isSubscribed && (
          <div className="mt-6 rounded-md border border-green-400/30 bg-green-500/10 p-4 text-green-100">
            <p className="font-semibold">Subscription active</p>
            <p className="mt-1 text-sm">
              You have {subscriptionDaysRemaining} day{subscriptionDaysRemaining === 1 ? "" : "s"} left.
              {subscriptionExpiresAt ? ` Valid until ${subscriptionExpiresAt.toLocaleString()}.` : ""}
            </p>
          </div>
        )}

        {isSubscriptionExpired && (
          <div className="mt-6 rounded-md border border-red-400/30 bg-red-500/10 p-4 text-red-100">
            <p className="font-semibold">Premium expired</p>
            <p className="mt-1 text-sm">
              Your organizer access expired
              {subscriptionExpiresAt ? ` on ${subscriptionExpiresAt.toLocaleString()}` : ""}.
              Submit a new payment reference to renew premium access.
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-lg border border-white/10 bg-gray-950/70 p-5">
            <div className="flex items-center gap-2 text-yellow-100">
              <QrCode size={20} />
              <p className="font-semibold">Scan & Pay</p>
            </div>
            <img
              src={upiQr}
              alt="UPI payment QR"
              className="mx-auto mt-5 aspect-square w-full max-w-64 rounded-lg bg-white p-3 object-contain"
            />
            <div className="mt-5 rounded-md border border-white/10 bg-white/5 p-3 text-sm text-gray-300">
              <p>UPI ID</p>
              <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="break-all font-semibold text-white">{UPI_ID}</span>
                <button
                  type="button"
                  onClick={copyUpiId}
                  className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/15"
                >
                  <Copy size={14} />
                  Copy
                </button>
              </div>
            </div>
            {isUpiDeepLinkConfigured ? (
              <a
                href={upiUrl}
                onClick={() => setPaymentStarted(true)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-green-400 px-4 py-3 font-bold text-gray-950 hover:bg-green-300"
              >
                <Smartphone size={18} />
                Click to Proceed
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-gray-700 px-4 py-3 font-bold text-gray-400"
                title="Replace UPI_ID in Subscription.js to enable UPI app deep links."
              >
                <Smartphone size={18} />
                Scan QR to Pay
              </button>
            )}
          </section>

          <form onSubmit={handleActivate} className="rounded-lg border border-white/10 bg-gray-950/70 p-5">
            <div className="flex items-center gap-2 text-yellow-100">
              <ShieldCheck size={20} />
              <p className="font-semibold">Confirm Successful Transaction</p>
            </div>
            <p className="mt-2 text-sm text-gray-400">
              After the UPI app shows success, enter the UTR/reference number from your bank or UPI app.
            </p>
            {isSubscriptionRejected && (
              <div className="mt-4 rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
                <p className="font-semibold">Previous verification was rejected.</p>
                <p className="mt-1">
                  {profile?.subscription?.rejectionReason || "Please verify your payment details and submit again."}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setPaymentStarted(true)}
              disabled={isSubscribed || isSubscriptionPending || processing}
              className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold sm:w-auto ${
                paymentStarted
                  ? "bg-green-400/15 text-green-200"
                  : "bg-white/10 text-white hover:bg-white/15"
              }`}
            >
              <CheckCircle2 size={17} />
              {paymentStarted ? "Payment step completed" : "I have completed UPI payment"}
            </button>

            <label className="mt-5 block text-sm text-gray-300">
              WhatsApp / Phone Number
              <input
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                placeholder="Example: 9876543210"
                className="input-surface mt-2 w-full rounded-md px-3 py-2"
                disabled={isSubscribed || isSubscriptionPending || processing}
              />
            </label>

            <label className="mt-5 block text-sm text-gray-300">
              UPI UTR / Transaction Reference
              <input
                value={paymentRefNo}
                onChange={(event) => setPaymentRefNo(event.target.value)}
                placeholder="Example: 412345678901"
                className="input-surface mt-2 w-full rounded-md px-3 py-2"
                disabled={isSubscribed || isSubscriptionPending || processing}
              />
            </label>

            {message && (
              <p className={`mt-3 text-sm ${message.includes("copied") ? "text-green-200" : "text-red-200"}`}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubscribed || isSubscriptionPending || processing}
              className="mt-5 w-full rounded-md bg-yellow-400 px-5 py-3 font-semibold text-gray-950 hover:bg-yellow-300 disabled:opacity-60 sm:w-auto"
            >
              {isSubscribed
                ? "Subscription Active"
                : isSubscriptionPending
                  ? "Pending Verification"
                  : processing
                    ? "Submitting..."
                    : isSubscriptionExpired
                      ? "Submit Renewal for Verification"
                    : isSubscriptionRejected
                      ? "Resubmit for Verification"
                      : "Submit for Verification"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
