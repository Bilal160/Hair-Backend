import mongoose, { Schema } from "mongoose";
import { ISubscription } from "../interfaces/subscriptionInterface";

export const SubscriptionSchema: Schema = new mongoose.Schema(
  {
    paymentCardId: {
      type: String,
      required: false,
      ref: "PaymentCard",
    },
    subscriptionStatus: {
      type: String,
      required: false,
      default: "trial",
    },
    userId: {
      type: String,
      required: false,
    },
    subscriptionStartDate: {
      type: Date,
      required: false,
    },
    subscriptionExpiryDate: {
      type: Date,
      required: false,
    },
    previousSubscriptionStatus: {
      type: String,
      required: false,
    },
    expiryReason: {
      type: String,
      required: false,
      default: "",
    },
    subscriptionMethod: {
      type: String,
      required: false,
      default: "",
    },
    subscriptionMethodId: {
      type: String,
      required: false,
      default: "",
    },
  },

  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

SubscriptionSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

SubscriptionSchema.virtual("paymentCard", {
  ref: "PaymentCard",
  localField: "paymentCardId",
  foreignField: "_id",
  justOne: true,
});

export const SubscriptionModel = mongoose.model<ISubscription>(
  "Subscription",
  SubscriptionSchema,
  "subscriptions"
);
