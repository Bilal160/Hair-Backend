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


export const createStripeConnectAccount = async (
  { email, country = "PK" }: CreateConnectAccountParams
): Promise<CreateConnectAccountResponse> => {
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

    // Create onboarding link
    const accountLink = await stripeClient.accountLinks.create({
      account: account.id,
      refresh_url: "https://yourdomain.com/retry-onboarding",
      return_url: "https://yourdomain.com/onboarding-success",
      type: "account_onboarding",
    });

    return { account, accountLink };
  } catch (error: any) {
    console.error("Error creating Stripe Connect account:", error);
    throw new Error(error?.message || "Stripe Connect account creation failed");
  }
};
