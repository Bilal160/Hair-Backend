import mongoose, { Schema } from "mongoose";
import { IPaymentCard } from "../interfaces/paymentCardInterface";

export const PaymentCardSchema: Schema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    stripeCustomerId: {
      type: String,
      required: false,
    },
    stripePaymentMethodId: {
      type: String,
      required: false,
    },
    cardLast4Number: {
      type: String,
      required: false,
    },
    cardBrand: {
      type: String,
      required: false,
    },
  },

  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const PaymentCardModel = mongoose.model<IPaymentCard>(
  "PaymentCard",
  PaymentCardSchema,
  "paymentcards"
);
