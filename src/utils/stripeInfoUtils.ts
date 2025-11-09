import Stripe from "stripe";

export const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-09-30.clover",
});


interface CreateConnectAccountParams {
  email: string;
  country?: string; // default "PK"
}

interface CreateConnectAccountResponse {
  account: Stripe.Account;
  accountLink: Stripe.AccountLink;
}


// "File Added  Of Stripe//"

export const createStripeCustomer = async ({
  email,
  name,
}: {
  email: string;
  name: string;
}) => {
  const customer = await stripeClient.customers.create({
    email,
    name,
  });
  return customer;
};


// export const createStripeConnectAccount = async (
//   { email, country = "PK" }: CreateConnectAccountParams
// ): Promise<CreateConnectAccountResponse> => {
//   try {
//     const account = await stripeClient.accounts.create({
//       type: "express",
//       country,
//       email,
//       capabilities: {
//         card_payments: { requested: true },
//         transfers: { requested: true },
//       },
//     });

//     // Create onboarding link
//     const accountLink = await stripeClient.accountLinks.create({
//       account: account.id,
//       refresh_url: "https://yourdomain.com/retry-onboarding",
//       return_url: "https://yourdomain.com/onboarding-success",
//       type: "account_onboarding",
//     });

//     return { account, accountLink };
//   } catch (error: any) {
//     console.error("Error creating Stripe Connect account:", error);
//     throw new Error(error?.message || "Stripe Connect account creation failed");
//   }
// };


export const createStripeConnectAccount = async (
  { email, country = "PK" }: CreateConnectAccountParams
): Promise<{ accountId: string; accountOnboardingUrl: string }> => {
  try {
    const account = await stripeClient.accounts.create({
      type: "express",
      country,
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    const accountLink = await stripeClient.accountLinks.create({
      account: account.id,
      refresh_url: "https://hair-salon-frontend-rouge.vercel.app/business/connectAccountInfo",
      return_url: "https://hair-salon-frontend-rouge.vercel.app/business/connectAccountInfo",
      type: "account_onboarding",
    });

    return {
      accountId: account.id,
      accountOnboardingUrl: accountLink.url,
    };
  } catch (error: any) {
    console.error("Error creating Stripe Connect account:", error);
    throw new Error(error?.message || "Stripe Connect account creation failed");
  }
};


// Check Account Status

// export const checkStripeAccountStatus = async (accountId: string) => {
//   try {
//     const account = await stripeClient.accounts.retrieve(accountId);

//     // You can inspect fields like these:
//     const detailsSubmitted = account.details_submitted; // boolean
//     const payoutsEnabled = account.payouts_enabled; // boolean
//     const chargesEnabled = account.charges_enabled; // boolean
//     const requirements = account.requirements; // verification details

//     const verificationStatus = {
//       verified:
//         account.details_submitted &&
//         account.charges_enabled &&
//         account.payouts_enabled,
//       details_submitted: account.details_submitted,
//       payouts_enabled: account.payouts_enabled,
//       charges_enabled: account.charges_enabled,
//       currently_due: account.requirements?.currently_due || [],
//       eventually_due: account.requirements?.eventually_due || [],
//     };

//     return verificationStatus;
//   } catch (error: any) {
//     console.error("Error checking Stripe account status:", error);
//     throw new Error(error?.message || "Failed to check account status");
//   }
// };

export const checkStripeAccountStatus = async (accountId: string) => {
  try {
    const account = await stripeClient.accounts.retrieve(accountId);

    return {
      stripeAccountVerified: account.details_submitted && account.charges_enabled && account.payouts_enabled,
      stripeDetailEnabled: account.details_submitted,
      stripePayoutEnabled: account.payouts_enabled,
      stripeChargesEnabled: account.charges_enabled,
      currently_due: account.requirements?.currently_due || [],
      eventually_due: account.requirements?.eventually_due || [],
    };
  } catch (error: any) {
    console.error("Error checking Stripe account status:", error);
    throw new Error(error?.message || "Failed to check account status");
  }
};


// Regernerate Account Obboarding Url

export const regenerateStripeOnboardingLink = async ({
  accountId,
  refreshUrl = "https://hair-salon-frontend-rouge.vercel.app//business/connectAccountInfo",
  returnUrl = "https://hair-salon-frontend-rouge.vercel.app//business/connectAccountInfo",
}: {
  accountId: string;
  refreshUrl?: string;
  returnUrl?: string;
}): Promise<{ accountId: string; onboardingUrl: string }> => {
  try {
    // Ensure account exists before generating link
    const account = await stripeClient.accounts.retrieve(accountId);

    if (!account) {
      throw new Error("Invalid Stripe account ID. Account not found.");
    }

    // Generate a new onboarding session link for updating details
    const accountLink = await stripeClient.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return {
      accountId,
      onboardingUrl: accountLink.url,
    };
  } catch (error: any) {
    console.error("Error regenerating Stripe onboarding link:", error);
    throw new Error(error?.message || "Failed to regenerate Stripe onboarding link");
  }
};

