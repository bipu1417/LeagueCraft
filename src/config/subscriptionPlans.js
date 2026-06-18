export const SUBSCRIPTION_PLANS = {
  weeklyOrganizer: {
    id: "weeklyOrganizer",
    name: "Premium Plan",
    plan: "organizer",
    amount: 299,
    currency: "INR",
    validityDays: 7,
    features: ["Create tournaments", "Open registrations", "Run auctions"],
  },
  // Add future plans here, for example:
  // monthlyOrganizer: { ...weeklyOrganizer, id: "monthlyOrganizer", amount: 999, validityDays: 30 },
  // yearlyOrganizer: { ...weeklyOrganizer, id: "yearlyOrganizer", amount: 4999, validityDays: 365 },
};

export const DEFAULT_SUBSCRIPTION_PLAN_ID = "weeklyOrganizer";

export const getSubscriptionPlan = (planId = DEFAULT_SUBSCRIPTION_PLAN_ID) =>
  SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS[DEFAULT_SUBSCRIPTION_PLAN_ID];

export const formatValidity = (days) => `${days} day${Number(days) === 1 ? "" : "s"}`;
