import { Booking } from "../../models/bookingModel";
import { BookingInterfase } from "../../interfaces/bookingInterface";
import { formatToUTC } from "../../utils/helperUtils";
import { populate } from "dotenv";
import { stripeClient } from "../../utils/stripeInfoUtils";

export class userBookingService {
    // CREATE
    static async createBooking(bookingData: Partial<BookingInterfase>) {
        try {
            const newBooking = await Booking.create(bookingData);
            return newBooking;
        } catch (error) {
            throw error;
        }
    }

    // READ One
    static async getBookingById(bookingId: string) {
        try {
            const booking = await Booking.findById(bookingId).populate([
                {
                    path: "business",
                    select: "_id businessName phone operatingHours operatingDays businessLocation "
                },
                {
                    path: "serviceInfo",
                    select: "_id name price servicePhotoId",
                    populate: { path: "servicePhoto", select: "url key" }
                },
                {
                    path: "bookingUser",
                    select: "_id name email"
                }

            ])

            return booking;
        } catch (error) {
            throw error;
        }
    }

    // READ All with Pagination
    static async fetchBookingsWithPagination({
        userId,
        businessId,
        bookingStatus, // 0 = pending, 1 = approved, 2 = completed
        bookingDate,
        page = 1,
        limit = 10,
    }: {
        userId?: string;
        businessId?: string;
        bookingStatus?: number;
        bookingDate?: string;
        page?: number;
        limit?: number;
    }) {
        try {
            const filterConditions: any = {};

            if (userId) filterConditions.bookingUserId = userId;
            if (businessId) filterConditions.businessId = businessId;
            if (typeof bookingStatus === "number") filterConditions.bookingStatus = bookingStatus;

            // ✅ Exact date match (since bookingDate is a string field)
            if (bookingDate) {
                // Normalize date string to your saved format
                const normalizedDate = `${bookingDate}T00:00:00.000Z`;
                filterConditions.bookingDate = normalizedDate;
            }

            console.log("📅 Filter Conditions:", filterConditions);

            const options = {
                page,
                limit,
                sort: { bookingDate: -1 }, // latest booking first
                populate: [
                    { path: "business", select: "_id businessName phone operatingHours operatingDays businessLocation" },
                    { path: "serviceInfo", select: "_id name price servicePhotoId", populate: { path: "servicePhoto", select: "url key" } },
                    { path: "bookingUser", select: "_id name email" },
                ],
            };

            const bookings = await Booking.paginate(filterConditions, options);

            return {
                bookings: bookings.docs,
                pagination: {
                    page: bookings.page,
                    totalPages: bookings.totalPages,
                    totalDocs: bookings.totalDocs,
                    limit: bookings.limit,
                },
            };
        } catch (error) {
            throw error;
        }
    }





    // UPDATE
    static async updateBooking(bookingId: string, updateData: Partial<BookingInterfase>) {
        try {
            const updated = await Booking.findByIdAndUpdate(bookingId, updateData, {
                new: true,
            });
            return updated;
        } catch (error) {
            throw error;
        }
    }

    // DELETE
    static async deleteBooking(bookingId: string) {
        try {
            const deleted = await Booking.findByIdAndDelete(bookingId);
            return deleted;
        } catch (error) {
            throw error;
        }
    }

    static async processPaymentForBooking(bookingId: string, paymentMethodId: string) {
        try {
            // 1️⃣ Find booking and populate required fields
            const booking = await Booking.findById(bookingId)
                .populate([
                    {
                        path: "serviceInfo",
                        select: "_id name price servicePhotoId",
                        populate: { path: "servicePhoto", select: "url key" }
                    },
                    {
                        path: "business",
                        select: "_id businessName phone operatingHours operatingDays businessLocation"
                    },
                    {
                        path: "bookingUser",
                        select: "_id name email stripeCustomerId"
                    },
                    {
                        path: "serviceProvider",
                        select: "_id name email stripeAccountId"
                    }
                ])
                .exec();

            if (!booking) throw new Error("Booking not found");

            console.log(booking.serviceProvider, "Service Provide")

            const service: any = booking?.serviceInfo;
            const serviceProvider: any = booking?.serviceProvider;

            if (!service || !serviceProvider) {
                throw new Error("Missing service or service provider info");
            }

            if (!serviceProvider.stripeAccountId) {
                throw new Error("Service provider does not have a Stripe Connect account");
            }

            // 2️⃣ Calculate amounts
            const amount = Math.round(service.price * 100); // Stripe uses cents
            const platformFee = Math.round(amount * 0.10); // 10% platform fee

            // 3️⃣ Create PaymentIntent
            const paymentIntent = await stripeClient.paymentIntents.create({
                amount,
                currency: "cad",
                customer: booking?.bookingUser?.stripeCustomerId as string | undefined || "",
                payment_method: paymentMethodId,
                confirm: true,
                automatic_payment_methods: { enabled: true, allow_redirects: "never" },
                application_fee_amount: platformFee, // 💰 Platform’s commission
                transfer_data: {
                    destination: serviceProvider.stripeAccountId, // 💸 Send to provider’s connected account
                },
                description: `Payment for booking ${bookingId}`,
            });

            // 4️⃣ Update booking status
            booking.bookingStatus = 3; // e.g., “Paid”
            await booking.save();

            return {
                success: true,
                message: "Payment successful",
                paymentIntent,
            };
        } catch (error: any) {
            console.error("❌ Error in processPaymentForBooking:", error.message);
            throw new Error(error.message);
        }
    }

}
