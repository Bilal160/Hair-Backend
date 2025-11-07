import { PaymentCardModel } from "../../models/paymentCard";
import { stripeClient } from "../../utils/stripeInfoUtils";
import { SubscriptionModel } from "../../models/subscription";
import { timeLimit } from "../../utils/constants";
import { ISubscription } from "../../interfaces/subscriptionInterface";
import { CreatePaymentIntentInput } from "../../interfaces/paymentCardInterface";

export class PaymentService {
  static async createSetupIntentService(stripeCustomerId: string) {
    try {
      const setupIntent = await stripeClient.setupIntents.create({
        customer: stripeCustomerId,
        usage: "off_session",
        payment_method_types: ["card"],
      });

      return setupIntent;
    } catch (error) {
      console.error("Create Setup Intent Error:", error);
      throw error;
    }
  }

  static async savePaymentCardService({
    userId,
    stripeCustomerId,
    stripePaymentMethodId,
    cardLast4Number,
    cardBrand,
  }: {
    userId: string;
    stripeCustomerId: string;
    stripePaymentMethodId: string;
    cardLast4Number: string;
    cardBrand: string;
  }) {
    try {
      const newCard = await PaymentCardModel.create({
        userId,
        stripeCustomerId,
        stripePaymentMethodId,
        cardLast4Number,
        cardBrand,
      });

      const finalData = {
        id: newCard._id,
        stripeCustomerId: newCard.stripeCustomerId,
        stripePaymentMethodId: newCard.stripePaymentMethodId,
        cardLast4Number: newCard.cardLast4Number,
        cardBrand: newCard.cardBrand,
      };

      return finalData;
    } catch (error) {
      console.error("Save Payment Card Error:", error);
      throw error;
    }
  }

  static async getPaymentMethodDetails(
    paymentMethodId: string,
    customerId: string
  ) {
    try {
      const paymentMethod = await stripeClient.paymentMethods.retrieve(
        paymentMethodId
      );

      if (paymentMethod.customer !== customerId) {
        throw new Error(
          "Payment method does not belong to the provided customer"
        );
      }

      return paymentMethod;
    } catch (error) {
      console.error("Error fetching payment method:", error);
      throw error;
    }
  }

  static async createSubscriptionService({ data }: { data: ISubscription }) {
    try {
      const subscriptionDoc = await SubscriptionModel.create({ ...data });
      const subscription = subscriptionDoc.toObject();

      let finalData = {
        id: subscription._id,
        subscriptionStatus: subscription.subscriptionStatus,
        paymentCardId: subscription.paymentCardId,
        userId: subscription.userId,
        subscriptionExpiryDate: subscription.subscriptionExpiryDate,
        previousSubscriptionStatus: subscription.previousSubscriptionStatus,
      };

      return finalData;
    } catch (error) {
      console.error("Create Subscription Error:", error);
      throw error;
    }
  }

  static async getPaymentByUserId(userId: string) {
    try {
      const payment = await PaymentCardModel.findOne({ userId });

      if (!payment) {
        return null;
      }

      return payment;
    } catch (error) {
      console.error("Get Payment By User Id Error:", error);
      throw error;
    }
  }

  static async getSubscriptionByUserId(userId: string) {
    try {
      const subscription = await SubscriptionModel.findOne({ userId }).select(
        "-__v -createdAt -updatedAt"
      );

      if (!subscription) {
        return null;
      }

      // Only populate paymentCard if paymentCardId exists
      if (subscription.paymentCardId) {
        await subscription.populate({
          path: "paymentCard",
          select:
            "stripeCustomerId stripePaymentMethodId cardLast4Number cardBrand",
        });
      }

      // Convert to object and append paymentCard: null if paymentCardId is null
      const subscriptionData = subscription.toObject() as any;
      if (subscription.paymentCardId === null) {
        subscriptionData.paymentCard = null;
      }

      return subscriptionData;
    } catch (error) {
      console.error("Get Subscription By User Id Error:", error);
      throw error;
    }
  }

  static async updateCustomerDefaultCard(
    customerId: string,
    newPaymentMethodId: string
  ) {
    try {
      await stripeClient.paymentMethods.attach(newPaymentMethodId, {
        customer: customerId,
      });

      const { data: existingPaymentMethods } =
        await stripeClient.paymentMethods.list({
          customer: customerId,
          type: "card",
        });

      const detachPromises = existingPaymentMethods
        .filter((pm) => pm.id !== newPaymentMethodId)
        .map((pm) => stripeClient.paymentMethods.detach(pm.id));

      await Promise.all(detachPromises);

      const updatedCustomer = await stripeClient.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: newPaymentMethodId,
        },
      });

      return updatedCustomer;
    } catch (error: any) {
      console.error("Error updating customer default card:", error.message);
      throw new Error("Failed to update customer card.");
    }
  }

  static async updatePaymentCard({
    userId,
    stripeCustomerId,
    stripePaymentMethodId,
    cardLast4Number,
    cardBrand,
  }: {
    userId: string;
    stripeCustomerId: string;
    stripePaymentMethodId: string;
    cardLast4Number: string;
    cardBrand: string;
  }) {
    try {
      const cards = await this.getPaymentByUserId(userId);

      if (!cards || cards === null) {
        // Create new card if none exists
        return await this.savePaymentCardService({
          userId,
          stripeCustomerId,
          stripePaymentMethodId,
          cardLast4Number: cardLast4Number || "",
          cardBrand: cardBrand || "",
        });
      }

      // Update existing card
      const updatedData = await PaymentCardModel.findByIdAndUpdate(
        cards._id,
        {
          stripeCustomerId: stripeCustomerId,
          stripePaymentMethodId: stripePaymentMethodId,
          cardLast4Number: cardLast4Number,
          cardBrand: cardBrand,
        },
        { new: true }
      );

      const card = {
        id: updatedData?.id,
        stripeCustomerId: updatedData?.stripeCustomerId,
        stripePaymentMethodId: updatedData?.stripePaymentMethodId,
        cardLast4Number: updatedData?.cardLast4Number,
        cardBrand: updatedData?.cardBrand,
      };

      return card;
    } catch (error) {
      console.error("Error updating payment card:", error);
      throw new Error("Failed to update payment card");
    }
  }

  static async createPaymentIntent({
    amount,
    currency,
    customerId,
    paymentMethodId,
  }: CreatePaymentIntentInput) {
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: true,
      setup_future_usage: "off_session", // Save card for future use
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
    });

    return paymentIntent;
  }

  static async updateSubscription(
    userId: string,
    subscriptionId: string,
    data: object
  ) {
    const subscription = await this.getSubscriptionByUserId(userId);
    if (subscription === null) {
      return null;
    }

    const updatedSubscription = await SubscriptionModel.findByIdAndUpdate(
      subscriptionId,
      data,
      { new: true }
    );

    let finalData = updatedSubscription?.toObject();

    return finalData;
  }

  static async detachPaymentMethod({
    stripePaymentMethodId,
  }: {
    stripePaymentMethodId: string;
  }) {
    const detachPaymentMethod = await stripeClient.paymentMethods.detach(
      stripePaymentMethodId
    );

    if (detachPaymentMethod) {
      return true;
    }
    return false;
  }

  static async deletePaymentCardService({ id }: { id: string }) {
    try {
      await PaymentCardModel.findByIdAndDelete(id);
      console.log("Successfully deleted item");
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  
}
