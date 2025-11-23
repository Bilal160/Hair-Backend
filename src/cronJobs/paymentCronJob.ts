import cron from "node-cron";
import { PaymentService } from "../services/payment/paymentService";
import { timeLimit } from "../utils/constants";
import { SubscriptionModel } from "../models/subscription";
import { PaymentCardModel } from "../models/paymentCard";
import { BusinessProfileService } from "../services/businessProfile/businessProfile";

async function checkSubscriptionsAndProcessPayments() {
  try {
    // Get all subscriptions that are either in trial or subscribed state
    const subscriptions = await SubscriptionModel.find({
      subscriptionStatus: { $in: ["trial", "subscribed"] },
    });

    for (const subscription of subscriptions) {
      const trialEndDate = new Date(subscription.subscriptionExpiryDate as any);
      const currentDate = new Date();
      const timeUntilTrialEnd = trialEndDate.getTime() - currentDate.getTime();

      // If trial/subscription has ended
      if (timeUntilTrialEnd <= 0) {
        // Check if paymentCardId exists and is not empty
        if (
          !subscription?.paymentCardId ||
          subscription.paymentCardId.trim() === ""
        ) {
          console.error(
            `No paymentCardId found for subscription ${subscription.id}`
          );

          await expireSubscription(subscription, "0");
          continue;
        }

        // Get payment card details
        const paymentCard = await PaymentCardModel.findById(
          subscription.paymentCardId
        );

        if (!paymentCard) {
          console.error(
            `Payment card not found for ID: ${subscription.paymentCardId}`
          );

          await expireSubscription(subscription, "0");
          continue;
        }

        try {
          // Process payment
          console.log(paymentCard, "Coming Card Info");
          const paymentIntent = await PaymentService.createPaymentIntent({
            amount: 1999,
            currency: "cad",
            customerId: paymentCard.stripeCustomerId,
            paymentMethodId: paymentCard.stripePaymentMethodId,
          });

          if (paymentIntent.status === "succeeded") {
            const oneMonthFromNow = new Date(
              new Date().getTime() + timeLimit.forSubscription
            ).toISOString();

            await SubscriptionModel.findByIdAndUpdate(subscription.id, {
              subscriptionStatus: "standard",
              paymentCardId: paymentCard.id,
              subscriptionExpiryDate: oneMonthFromNow,
              subscriptionStartDate: new Date().toISOString(),
              previousSubscriptionStatus: subscription?.subscriptionStatus,
              expiryReason: null,
            });
            await BusinessProfileService.updateSubscriptionType(
              subscription.userId as string,
              "standard"
            );
          } else {
            console.error(
              `Payment failed for subscription ${subscription.id}, Status: ${paymentIntent.status}`
            );
            await expireSubscription(subscription, "1"); // Reason: Payment failure
            await BusinessProfileService.updateSubscriptionType(
              subscription.userId as string,
              "free"
            );
          }
        } catch (error) {
          console.error(
            `Payment processing error for subscription ${subscription.id}:`,
            error
          );
          await expireSubscription(subscription, "1");
          await BusinessProfileService.updateSubscriptionType(
            subscription.userId as string,
            "free"
          );
        }
      }
    }
  } catch (error) {
    console.error("Error in subscription check:", error);
  }
}

// Helper to expire a subscription
async function expireSubscription(subscription: any, reason: string) {
  console.log(reason, "Reason");
  await SubscriptionModel.findByIdAndUpdate(subscription.id, {
    paymentCardId: null,
    subscriptionStatus: "expired",
    subscriptionExpiryDate: "",
    subscriptionStartDate: "",
    previousSubscriptionStatus: subscription?.subscriptionStatus,
    expiryReason: reason,
  });

  await BusinessProfileService.updateSubscriptionType(
    subscription.userId,
    "free"
  );
}

// Export the function to be used with cron
export { checkSubscriptionsAndProcessPayments };

cron.schedule("*/5 * * * *", async () => {
  console.log("⏳ Running subscription payment job...");
  try {
    await checkSubscriptionsAndProcessPayments();
  } catch (error) {
    console.error("❌ Cron job error:", error);
  }
});
