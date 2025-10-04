import { Document } from "mongoose";

export interface IPaymentCard extends Document {
  userId: string;
  stripeCustomerId: string;
  stripePaymentMethodId: string;
  cardLast4Number: string;
  cardBrand: string;
}

export interface CreatePaymentIntentInput {
  amount: number; // in dollars
  currency: string;
  customerId: string;
  paymentMethodId: string;
}
