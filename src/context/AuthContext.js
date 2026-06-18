import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { DEFAULT_SUBSCRIPTION_PLAN_ID, getSubscriptionPlan } from "../config/subscriptionPlans";
import { CREATOR_NOTIFICATION_PHONE, notifySafely } from "../utils/notificationService";

const AuthContext = createContext();
const CREATOR_EMAIL = "desiindianboyz@gmail.com";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        localStorage.removeItem(`demoSubscription:${firebaseUser.uid}`);

        const userRef = doc(db, "users", firebaseUser.uid);
        const freeProfile = {
          email: firebaseUser.email,
          role: "user",
          subscription: {
            status: "inactive",
            paymentStatus: "unpaid",
            plan: "free",
          },
        };

        try {
          const snap = await getDoc(userRef);
          let data = snap.exists() ? snap.data() : null;

          if (!data) {
            data = { ...freeProfile, createdAt: new Date() };
            await setDoc(userRef, data);
          }

          setProfile(data);
          setRole(data.role || "user");
        } catch (error) {
          console.warn("Unable to load user profile. Falling back to free access.", error);
          setProfile(freeProfile);
          setRole("user");
        }
      } else {
        setUser(null);
        setRole(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const subscription = useMemo(() => profile?.subscription || {}, [profile?.subscription]);
  const subscriptionStatus = useMemo(() => {
    const validUntil = subscription.validUntil?.toDate
      ? subscription.validUntil.toDate()
      : subscription.validUntil
        ? new Date(subscription.validUntil)
        : null;
    const hasPaidSubscription =
      subscription.status === "active" &&
      subscription.paymentStatus === "paid" &&
      validUntil;
    const now = Date.now();
    const validActive =
      hasPaidSubscription &&
      validUntil &&
      validUntil.getTime() > now;
    const isSubscribed = Boolean(validActive);

    return {
      validUntil,
      isSubscribed,
      isSubscriptionExpired: Boolean(hasPaidSubscription && validUntil.getTime() <= now),
      subscriptionDaysRemaining: isSubscribed
        ? Math.max(0, Math.ceil((validUntil.getTime() - now) / (1000 * 60 * 60 * 24)))
        : 0,
    };
  }, [subscription]);
  const {
    validUntil,
    isSubscribed,
    isSubscriptionExpired,
    subscriptionDaysRemaining,
  } = subscriptionStatus;
  const isCreator = user?.email?.toLowerCase() === CREATOR_EMAIL;
  const isSubscriptionPending = subscription.status === "pending" && subscription.paymentStatus === "pending";
  const isSubscriptionRejected = subscription.status === "rejected" || subscription.paymentStatus === "rejected";
  const effectiveRole = isSubscribed || isCreator || role === "platformAdmin" ? "admin" : "user";
  const logout = useCallback(() => signOut(auth), []);

  const submitSubscriptionForApproval = useCallback(async ({
    paymentRefNo,
    paymentMode = "upi",
    amount,
    plan,
    planId = DEFAULT_SUBSCRIPTION_PLAN_ID,
    validityDays,
    contactPhone = "",
  }) => {
    if (!user) return;
    const selectedPlan = getSubscriptionPlan(planId);
    const resolvedAmount = amount ?? selectedPlan.amount;
    const resolvedPlan = plan || selectedPlan.plan;
    const resolvedValidityDays = validityDays ?? selectedPlan.validityDays;

    const subscriptionData = {
      status: "pending",
      paymentStatus: "pending",
      plan: resolvedPlan,
      planId: selectedPlan.id,
      paymentRefNo,
      paymentMode,
      amount: resolvedAmount,
      currency: "INR",
      validityDays: resolvedValidityDays,
      contactPhone,
      submittedAt: new Date(),
    };

    await setDoc(
      doc(db, "users", user.uid),
      {
        email: user.email,
        role: "user",
        subscription: subscriptionData,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    await setDoc(
      doc(db, "subscriptionRequests", user.uid),
      {
        userId: user.uid,
        userEmail: user.email,
        status: "pending",
        paymentStatus: "pending",
        paymentRefNo,
        paymentMode,
        amount: resolvedAmount,
        currency: "INR",
        validityDays: resolvedValidityDays,
        contactPhone,
        plan: resolvedPlan,
        planId: selectedPlan.id,
        submittedAt: new Date(),
      },
      { merge: true }
    );

    setRole("user");
    setProfile((current) => ({
      ...(current || {}),
      subscription: subscriptionData,
      role: "user",
    }));

    await notifySafely({
      type: "subscription_request_submitted",
      recipientRole: "creator",
      recipientEmail: CREATOR_EMAIL,
      recipientPhone: CREATOR_NOTIFICATION_PHONE,
      title: "New subscription request",
      message: `${user.email} submitted a ${selectedPlan.name} subscription payment for Rs. ${resolvedAmount}. UPI Ref: ${paymentRefNo}.`,
      metadata: {
        userId: user.uid,
        planId: selectedPlan.id,
        paymentRefNo,
        amount: resolvedAmount,
      },
      senderId: user.uid,
      senderEmail: user.email,
    });
  }, [user]);

  const value = useMemo(() => ({
    user,
    role,
    effectiveRole,
    profile,
    loading,
    isSubscribed,
    isCreator,
    isSubscriptionPending,
    isSubscriptionRejected,
    isSubscriptionExpired,
    subscriptionExpiresAt: validUntil,
    subscriptionDaysRemaining,
    logout,
    submitSubscriptionForApproval,
  }), [
    effectiveRole,
    isCreator,
    isSubscribed,
    isSubscriptionExpired,
    isSubscriptionPending,
    isSubscriptionRejected,
    loading,
    logout,
    profile,
    role,
    submitSubscriptionForApproval,
    subscriptionDaysRemaining,
    user,
    validUntil,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
