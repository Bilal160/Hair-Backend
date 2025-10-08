import { Request, Response } from "express";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../utils/responseUtils";
import { createSetupIntentSchema } from "../../validations/paymentValidation";
import { handleValidationErrors } from "../../utils/helperUtils";
import { PaymentService } from "../../services/payment/paymentService";
import { BusinessProfileService } from "../../services/businessProfile/businessProfile";
import {
  trialSubscriptionPlan,
  premiumSubscriptionPlan,
  expiresSubscriptionPlan,
  standardSubscriptionPlan,
  sponsoredSubscriptionPlan,
} from "../../utils/constants";
import { ISubscription } from "../../interfaces/subscriptionInterface";

export class PaymentController {
  static async createSetupIntent(req: Request, res: Response) {
    const { stripeCustomerId } = req.body;

    const result = createSetupIntentSchema.safeParse(req.body);
    if (!result.success) {
      const errorMessage = handleValidationErrors(result.error);
      return sendErrorResponse(res, [errorMessage], 400);
    }

    try {
      const setupIntent = await PaymentService.createSetupIntentService(
        stripeCustomerId
      );
      return sendSuccessResponse(res, ["Setup intent created successfully"], {
        setupIntent,
      });
    } catch (error: any) {
      return sendErrorResponse(res, [error.message], 500);
    }
  }

  static async savePaymentCardController(req: Request, res: Response) {
    try {
      const { stripeCustomerId, stripePaymentMethodId } = req.body;
      const userId = req.userId;
      let planType = 0;

      if (!stripeCustomerId || !stripePaymentMethodId) {
        return sendErrorResponse(res, ["Missing required fields"], 400);
      }

      const payment = await PaymentService.getPaymentByUserId(userId);
      if (payment) {
        return sendErrorResponse(res, ["PaymentCard already exists"], 400);
      }

      const paymentMethod = await PaymentService.getPaymentMethodDetails(
        stripePaymentMethodId,
        stripeCustomerId
      );

      if (!paymentMethod) {
        return sendErrorResponse(res, ["Payment method not found"], 400);
      }

      const cardLast4Number = paymentMethod.card?.last4 || "";
      const cardBrand = paymentMethod.card?.brand || "";

      // --- Plan Config
      let planConfig: { plan: any; amount: number, subscriptionType: string };
      if (planType === 0) {
        planConfig = { plan: trialSubscriptionPlan, amount: 0, subscriptionType: "free" }; // $20
      } else if (planType === 2) {
        planConfig = { plan: sponsoredSubscriptionPlan, amount: 10000, subscriptionType: "sponsored" }; // $100
      }
      else {
        return sendErrorResponse(res, ["Invalid plan type"], 400);
      }



      // --- Save card
      const PaymentCard = await PaymentService.savePaymentCardService({
        userId,
        stripeCustomerId,
        stripePaymentMethodId,
        cardLast4Number,
        cardBrand,

      });

      // --- Subscription create
      const subscriptionData = {
        ...planConfig.plan,
        paymentCardId: PaymentCard.id,
        userId,
        subscriptionMethod: "stripe",
        subscriptionMethodId: PaymentCard.id,
      };

      const subscription = await PaymentService.createSubscriptionService({
        data: subscriptionData as any,
      });

      const subscriptionInfo = {
        ...subscription,
        paymentCard: PaymentCard,
      };

      const updatedSubscriptionType = await BusinessProfileService.updateSubscriptionType(userId, planConfig.subscriptionType);

      return sendSuccessResponse(res, ["Payment card saved successfully"], {
        subscriptionInfo,
      });
    } catch (error: any) {
      console.error("Error saving card:", error);
      return sendErrorResponse(res, ["Internal server error"], 500);
    }
  }


  static async getSubscriptionController(req: Request, res: Response) {
    const userId = req.userId;
    try {
      const subscription = await PaymentService.getSubscriptionByUserId(userId);

      if (subscription === null) {
        return sendSuccessResponse(
          res,
          ["No subscription found"],
          { subscription: null },
          404
        );
      }
      const subscriptionType = await BusinessProfileService.getUserSubscriptionType(userId);
      return sendSuccessResponse(res, ["Subscription fetched successfully"], {
        subscription,
        subscriptionType,
      });
    } catch (error: any) {
      return sendErrorResponse(res, [error.message], 500);
    }
  }

  static async updateStripeCardController(req: Request, res: Response) {
    try {
      const { stripeCustomerId, stripePaymentMethodId } = req.body;
      const userId = req.userId;

      if (!stripeCustomerId || !stripePaymentMethodId) {
        return sendErrorResponse(res, ["Missing required fields"], 400);
      }

      // 🧩 Update Stripe customer default card
      await PaymentService.updateCustomerDefaultCard(
        stripeCustomerId,
        stripePaymentMethodId
      );

      // 💳 Get card details from Stripe
      const paymentMethod = await PaymentService.getPaymentMethodDetails(
        stripePaymentMethodId,
        stripeCustomerId
      );

      const cardLast4Number = paymentMethod.card?.last4 || "";
      const cardBrand = paymentMethod.card?.brand || "";

      // 🧾 Update card record in DB
      const updatedCard = await PaymentService.updatePaymentCard({
        userId,
        stripeCustomerId,
        stripePaymentMethodId,
        cardLast4Number,
        cardBrand,
      });

      // 🔍 Get user subscription
      const subscription = await PaymentService.getSubscriptionByUserId(userId);

      if (!subscription) {
        return sendErrorResponse(res, ["Subscription not found"], 404);
      }

      // 🧠 CASE 1: Subscription expired → charge 19.99 CAD
      if (subscription.subscriptionStatus === "expired") {
        const paymentIntent = await PaymentService.createPaymentIntent({
          amount: 1999, // 19.99 CAD in cents
          currency: "cad",
          customerId: stripeCustomerId,
          paymentMethodId: stripePaymentMethodId,
        });

        if (paymentIntent.status !== "succeeded") {
          return sendErrorResponse(res, ["Payment did not succeed"], 402);
        }

        // ✅ Update subscription after payment
        const updatedSubscription = await PaymentService.updateSubscription(
          userId,
          subscription._id.toString(),
          {
            userId,
            subscriptionStatus: "subscribed",
            subscriptionStartDate: new Date(),
            subscriptionExpiryDate: new Date(
              new Date().setMonth(new Date().getMonth() + 1)
            ), // +1 month validity
            paymentCardId: updatedCard?.id,
            subscriptionMethod: "stripe",
            subscriptionMethodId: updatedCard?.id,
            expiryReason: "",
          }
        );

        // 🏢 Update business profile (if needed)
        await BusinessProfileService.updateSubscriptionType(userId, "standard");

        const responseData = {
          subscriptionInfo: {
            ...updatedSubscription,
            paymentCard: {
              id: updatedCard?.id,
              stripeCustomerId: updatedCard?.stripeCustomerId,
              stripePaymentMethodId: updatedCard?.stripePaymentMethodId,
              cardLast4Number: updatedCard?.cardLast4Number,
              cardBrand: updatedCard?.cardBrand,
            },
          },
        };

        return sendSuccessResponse(res, ["Payment charged and subscription renewed successfully"], responseData);
      }

      // 🧠 CASE 2: Subscription active → just update card info
      const updatedSubscription = await PaymentService.updateSubscription(
        userId,
        subscription._id.toString(),
        {
          paymentCardId: updatedCard?.id,
          subscriptionMethod: "stripe",
          subscriptionMethodId: updatedCard?.id,
        }
      );

      const responseData = {
        subscriptionInfo: {
          ...updatedSubscription,
          paymentCard: {
            id: updatedCard?.id,
            stripeCustomerId: updatedCard?.stripeCustomerId,
            stripePaymentMethodId: updatedCard?.stripePaymentMethodId,
            cardLast4Number: updatedCard?.cardLast4Number,
            cardBrand: updatedCard?.cardBrand,
          },
        },
      };

      return sendSuccessResponse(res, ["Card updated successfully"], responseData);

    } catch (error: any) {
      console.error("Error updating Stripe card:", error);
      return sendErrorResponse(res, ["Internal server error"], 500);
    }
  }



  static async removePaymentCardController(req: Request, res: Response) {
    try {
      const userId = req.userId;

      const paymentCard = await PaymentService.getPaymentByUserId(userId);

      if (!paymentCard) {
        return sendErrorResponse(res, ["Card not found for that user"], 400);
      }

      const detachSuccess = await PaymentService.detachPaymentMethod({
        stripePaymentMethodId: paymentCard?.stripePaymentMethodId,
      });

      if (!detachSuccess) {
        return sendErrorResponse(
          res,
          ["Failed to detach payment method, please try again later"],
          400
        );
      }

      const deletedCard = await PaymentService.deletePaymentCardService({
        id: paymentCard?.id,
      });

      if (!deletedCard) {
        return sendErrorResponse(res, ["Failed to delete payment card"], 500);
      }

      const subscriptionExists = await PaymentService.getSubscriptionByUserId(
        userId
      );

      let expiredSubscriptionData = null;

      if (subscriptionExists) {
        expiredSubscriptionData = {
          subscriptionStatus: subscriptionExists.subscriptionStatus,
          paymentCardId: null,
          userId: subscriptionExists.userId,
          subscriptionExpiryDate: subscriptionExists.subscriptionExpiryDate,
          previousSubscriptionStatus:
            subscriptionExists.previousSubscriptionStatus,
          expiryReason: subscriptionExists.expiryReason,
          subscriptionMethod: "stripe",
          subscriptionMethodId: null,
        };
      }
      const updatedSubscription = await PaymentService.updateSubscription(
        userId,
        subscriptionExists?._id.toString(),
        expiredSubscriptionData as any
      );

      if (!updatedSubscription) {
        return sendErrorResponse(res, ["Failed to update subscription"], 500);
      }

      const subscriptionInfo = { ...updatedSubscription, paymentCard: null };

      return sendSuccessResponse(res, ["Subscription Cancelled Successfully"], {
        subscriptionInfo,
      });
    } catch (error: any) {
      console.error("Error removing payment card:", error);
      return sendErrorResponse(res, ["Internal server error"], 500);
    }
  }


  static async changePlanController(req: Request, res: Response) {
    try {
      const { planType, stripeCustomerId, stripePaymentMethodId } = req.body;
      const userId = req.userId;

      // Validate planType is mandatory
      if (!planType) {
        return sendErrorResponse(res, ["Plan type is required"], 400);
      }

      // Validate planType value
      if (![1, 2].includes(planType)) {
        return sendErrorResponse(res, ["Invalid plan type. Must be 1, 2"], 400);
      }

      // Get existing subscription
      const subscriptionExists = await PaymentService.getSubscriptionByUserId(userId);

      if (!subscriptionExists) {
        return sendErrorResponse(res, ["No subscription found for this user"], 400);
      }

      // Plan Config
      let planConfig: { plan: any; amount: number, subscriptionType: string };
      if (planType === 1) {
        planConfig = { plan: standardSubscriptionPlan, amount: 2000, subscriptionType: "standard" }; // $20
      } else if (planType === 2) {
        planConfig = { plan: sponsoredSubscriptionPlan, amount: 10000, subscriptionType: "sponsored" }; // $100
      } else {
        return sendErrorResponse(res, ["Invalid plan type"], 400);
      }

      // Helper function to get plan type from subscription status
      const getPlanTypeFromStatus = (status: string): number => {
        switch (status) {
          case "standard":
            return 1;
          case "sponsored":
            return 2;
          default:
            return 0; // Unknown/expired
        }
      };

      const subscriptionType = await BusinessProfileService.getUserSubscriptionType(userId);
      const existingPlanType = getPlanTypeFromStatus(subscriptionType || "");
      const isPlanChanged = existingPlanType !== planType;
      const isDowngrade = existingPlanType > planType;

      // If plan hasn't changed, return current subscription
      if (!isPlanChanged) {
        return sendSuccessResponse(res, ["Plan is already active"], {
          subscriptionInfo: subscriptionExists,
        });
      }

      // Handle downgrade case - only update subscriptionType without charging
      if (isDowngrade) {
        let updatedCardData: any = null;

        // If card details are provided during downgrade, update the card
        if (stripeCustomerId && stripePaymentMethodId) {
          // Update default card in Stripe
          await PaymentService.updateCustomerDefaultCard(
            stripeCustomerId,
            stripePaymentMethodId
          );

          // Get card details
          const paymentMethod = await PaymentService.getPaymentMethodDetails(
            stripePaymentMethodId,
            stripeCustomerId
          );

          const cardLast4Number = paymentMethod.card?.last4 || "";
          const cardBrand = paymentMethod.card?.brand || "";

          // Update card in DB
          updatedCardData = await PaymentService.updatePaymentCard({
            userId,
            stripeCustomerId,
            stripePaymentMethodId,
            cardLast4Number,
            cardBrand,
          });
        }

        // Update Business Profile Subscription Type only
        await BusinessProfileService.updateSubscriptionType(
          userId,
          planConfig.subscriptionType || ""
        );

        // Update subscription with new paymentCardId if card was updated
        let updatedSubscription = subscriptionExists;
        if (updatedCardData) {
          const subscriptionUpdateData = {
            paymentCardId: updatedCardData._id || updatedCardData.id,
            subscriptionMethodId: updatedCardData._id || updatedCardData.id,
          };

          updatedSubscription = await PaymentService.updateSubscription(
            userId,
            subscriptionExists._id.toString(),
            subscriptionUpdateData
          );
        }

        // Prepare response data
        let cardFinalData;
        if (updatedCardData) {
          // New card was provided and updated
          cardFinalData = {
            id: updatedCardData.id,
            stripeCustomerId: updatedCardData.stripeCustomerId,
            stripePaymentMethodId: updatedCardData.stripePaymentMethodId,
            cardLast4Number: updatedCardData.cardLast4Number,
            cardBrand: updatedCardData.cardBrand,
          };
        } else {
          // Using existing card
          cardFinalData = subscriptionExists.paymentCard;
        }

        const subscriptionInfo = { ...updatedSubscription, paymentCard: cardFinalData };

        return sendSuccessResponse(res, ["Plan downgraded successfully"], {
          subscriptionInfo,
        }, 200);
      }

      let stripeCustomerIdToUse: string;
      let stripePaymentMethodIdToUse: string;
      let updatedCardData: any = null;

      // CASE 1: Only planType provided - use existing card
      if (!stripeCustomerId && !stripePaymentMethodId) {
        if (subscriptionExists.paymentCard === null) {
          return sendErrorResponse(res, ["No payment card found. Please provide card details"], 400);
        }

        stripeCustomerIdToUse = subscriptionExists.paymentCard.stripeCustomerId;
        stripePaymentMethodIdToUse = subscriptionExists.paymentCard.stripePaymentMethodId;
      }
      // CASE 2: planType + card details provided - update card and charge
      else {
        if (!stripeCustomerId || !stripePaymentMethodId) {
          return sendErrorResponse(res, ["Both stripeCustomerId and stripePaymentMethodId are required when updating card"], 400);
        }

        stripeCustomerIdToUse = stripeCustomerId;
        stripePaymentMethodIdToUse = stripePaymentMethodId;

        // Update default card in Stripe
        await PaymentService.updateCustomerDefaultCard(
          stripeCustomerId,
          stripePaymentMethodId
        );

        // Get card details
        const paymentMethod = await PaymentService.getPaymentMethodDetails(
          stripePaymentMethodId,
          stripeCustomerId
        );

        const cardLast4Number = paymentMethod.card?.last4 || "";
        const cardBrand = paymentMethod.card?.brand || "";

        // Update card in DB
        updatedCardData = await PaymentService.updatePaymentCard({
          userId,
          stripeCustomerId,
          stripePaymentMethodId,
          cardLast4Number,
          cardBrand,
        });
      }

      // Create payment intent and charge
      const paymentIntent = await PaymentService.createPaymentIntent({
        amount: planConfig.amount,
        currency: "cad",
        customerId: stripeCustomerIdToUse,
        paymentMethodId: stripePaymentMethodIdToUse,
      });

      if (paymentIntent.status !== "succeeded") {
        return sendErrorResponse(res, ["Payment did not succeed"], 402);
      }

      // Update subscription with new plan
      const updatedPlanData = {
        userId,
        subscriptionStatus: planConfig.plan.subscriptionStatus,
        subscriptionStartDate: planConfig.plan.subscriptionStartDate,
        subscriptionExpiryDate: planConfig.plan.subscriptionExpiryDate,
        previousSubscriptionStatus: subscriptionExists?.previousSubscriptionStatus || subscriptionExists?.subscriptionStatus || "",
        paymentCardId: updatedCardData?.id || subscriptionExists.paymentCardId,
        expiryReason: subscriptionExists?.expiryReason || "",
        subscriptionMethod: "stripe",
        subscriptionMethodId: updatedCardData?.id || subscriptionExists.paymentCardId,
      };

      const subscription = await PaymentService.updateSubscription(
        userId,
        subscriptionExists._id.toString(),
        updatedPlanData
      );

      // Update Business Profile Subscription Type
      if (subscription) {
        await BusinessProfileService.updateSubscriptionType(
          userId,
          planConfig.subscriptionType || ""
        );
      }

      // Prepare response data
      let cardFinalData;
      if (updatedCardData) {
        // New card was provided and updated
        cardFinalData = {
          id: updatedCardData.id,
          stripeCustomerId: updatedCardData.stripeCustomerId,
          stripePaymentMethodId: updatedCardData.stripePaymentMethodId,
          cardLast4Number: updatedCardData.cardLast4Number,
          cardBrand: updatedCardData.cardBrand,
        };
      } else {
        // Using existing card
        cardFinalData = subscriptionExists.paymentCard;
      }

      const subscriptionInfo = { ...subscription, paymentCard: cardFinalData };

      return sendSuccessResponse(res, ["Plan changed successfully"], {
        subscriptionInfo,
      }, 200);
    } catch (error: any) {
      console.error("Error changing plan:", error);
      if (error.message === "No card found for this user") {
        return sendErrorResponse(res, ["No card found for this user"], 400);
      }
      return sendErrorResponse(res, ["Internal server error"], 500);
    }
  }
}

