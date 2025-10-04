import { Document } from "mongoose";

export interface ISubscription extends Document {
  subscriptionStatus?: string;
  paymentCardId?: string;
  userId?: string;
  subscriptionStartDate?: Date;
  subscriptionExpiryDate?: Date;
  previousSubscriptionStatus?: string;
  expiryReason?: string;
  subscriptionMethod?: string;
  subscriptionMethodId?: string;
}
