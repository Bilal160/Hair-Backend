import mongoose, { Schema, Document } from "mongoose";
import paginate from "mongoose-paginate-v2";
import { BookingInterfase } from "../interfaces/bookingInterface"; // adjust path if needed

const bookingSchema: Schema = new Schema(
    {
        userId: {
            type: mongoose.Types.ObjectId,
            ref: "User",
            required: true,
        },
        businessId: {
            type: mongoose.Types.ObjectId,
            ref: "BusinessProfile",
            required: true,
        },
        serviceId: {
            type: mongoose.Types.ObjectId,
            ref: "Services",
            required: true,
        },
        bookingUserId: {
            type: mongoose.Types.ObjectId,
            ref: "User",
            required: true,
        },
        bookingDate: {
            type: String,
            required: true,
            trim: true,
        },
        bookingMessage: {
            type: String,
            required: false,
            default: null,
            trim: true,
        },
        bookingContactNumber: {
            type: String,
            required: true,
            trim: true,
        },

        bookingStatus: {
            type: Number,
            enum: [0, 1, 2, 3],
            default: 0
        }
    },
    {
        timestamps: true, // adds createdAt & updatedAt
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// --- Optional: virtual population example (if needed later) ---
bookingSchema.virtual("business", {
    ref: "BusinessProfile",
    localField: "businessId",
    foreignField: "_id",
    justOne: true,
});

bookingSchema.virtual("bookingUser", {
    ref: "User",
    localField: "bookingUserId",
    foreignField: "_id",
    justOne: true,
});

bookingSchema.virtual("serviceProvider", {
    ref: "User",
    localField: "userId",
    foreignField: "_id",
    justOne: true,
});


bookingSchema.virtual("serviceInfo", {
    ref: "Service",
    localField: "serviceId",
    foreignField: "_id",
    justOne: true,
});



bookingSchema.plugin(paginate);

export const Booking = mongoose.model<
    BookingInterfase,
    mongoose.PaginateModel<BookingInterfase>
>("Booking", bookingSchema, "bookings");
