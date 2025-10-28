import { z } from "zod";

export const createBookingSchema = z.object({
    userId: z.string({ required_error: "UserId is required" }),
    businessId: z.string({ required_error: "BusinessId is required" }),
    serviceId: z.string({ required_error: "ServiceId is required" }),
    bookingDate: z.string({ required_error: "Booking Date is required" }),
    bookingMessage: z.string().optional().nullable(),
    bookingContactNumber: z.string({ required_error: "Contact Number is required" }),
});

export const updateBookingSchema = z.object({
    bookingDate: z.string().optional(),
    bookingMessage: z.string().optional().nullable(),
    bookingContactNumber: z.string().optional(),
});
