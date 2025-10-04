export const timeLimit = {
  // forTrial: 7 * 24 * 60 * 60 * 1000,
  // forSubscription: 365 * 24 * 60 * 60 * 1000,
  forTrial: 30 * 60 * 1000, // 30 minutes
  forSubscription: 30 * 24 * 60 * 60 * 1000, // 3 days
};

export const trialSubscriptionPlan = {
  subscriptionStatus: "trial",
  subscriptionStartDate: new Date(Date.now()),
  subscriptionExpiryDate: new Date(Date.now() + timeLimit.forTrial),
  previousSubscriptionStatus: "",
};

export const premiumSubscriptionPlan = {
  subscriptionStatus: "subscribed",
  subscriptionStartDate: new Date(Date.now()),
  subscriptionExpiryDate: new Date(Date.now() + timeLimit.forSubscription),
  previousSubscriptionStatus: "trial",
};

export const standardSubscriptionPlan = {
  subscriptionStatus: "standard",
  subscriptionStartDate: new Date(Date.now()),
  subscriptionExpiryDate: new Date(Date.now() + timeLimit.forSubscription),
  previousSubscriptionStatus: "",
};


export const sponsoredSubscriptionPlan = {
  subscriptionStatus: "sponsored",
  subscriptionStartDate: new Date(Date.now()),
  subscriptionExpiryDate: new Date(Date.now() + timeLimit.forSubscription),
  previousSubscriptionStatus: "",
};

export const expiresSubscriptionPlan = {
  subscriptionStatus: "expired",
  subscriptionStartDate: new Date(Date.now()),
  subscriptionExpiryDate: new Date(Date.now()),
  previousSubscriptionStatus: "",
};

export const adminSubscriptionPlan = {
  subscriptionStatus: "subscribed",
  paymentCardId: null,
  subscriptionStartDate: new Date(Date.now()),
  subscriptionExpiryDate: new Date(Date.now() + timeLimit.forSubscription),
  subscriptionMethod: "bankTransfer",
  previousSubscriptionStatus: "",
};
