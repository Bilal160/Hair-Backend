import mongoose, { Document } from "mongoose";
export interface BookingInterfase extends Document {
    userId: mongoose.Types.ObjectId | string;
    businessId: mongoose.Types.ObjectId | string;
    serviceId: mongoose.Types.ObjectId | string;
    bookingUserId: mongoose.Types.ObjectId | string
    bookingDate?: string;
    bookingMessage?: string | null
    bookingContactNumber?: string
    bookingStatus?: number
    serviceInfo?: any;
    business?: any;
    serviceProvider?: any;
    bookingUser?: any;


}