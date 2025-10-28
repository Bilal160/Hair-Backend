import { Booking } from "../../models/bookingModel";
import { BookingInterfase } from "../../interfaces/bookingInterface";

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
                    select: "_id name  "
                },
                {
                    path: "serviceInfo",
                    select: "_id name price"
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
        page = 1,
        limit = 10,
    }: {
        userId?: string;
        businessId?: string;
        page?: number;
        limit?: number;
    }) {

        console.log(userId, "Coming")
        try {
            const filterConditions: any = {};

            if (userId) filterConditions.bookingUserId = userId;
            if (businessId) filterConditions.businessId = businessId;

            const options = {
                page,
                limit,
                sort: { createdAt: -1 },
                populate: [
                    {
                        path: "business",
                        select: "_id businessName",
                    },
                    {
                        path: "serviceInfo", // assuming your schema field is serviceId
                        select: "_id name price",
                        as: "serviceInfo", // optional: rename in populated result
                    },
                    {
                        path: "bookingUser", // assuming your schema field is bookingUserId
                        select: "_id name email",
                        as: "bookingUser",
                    },
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
}
