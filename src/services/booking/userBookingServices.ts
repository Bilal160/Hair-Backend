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
        active, // 0 = pending, 1 = approved, 2 = completed
        bookingDate,
        page = 1,
        limit = 10,
    }: {
        userId?: string;
        businessId?: string;
        active?: number;
        bookingDate?: string;
        page?: number;
        limit?: number;
    }) {
        try {
            const filterConditions: any = {};

            if (userId) filterConditions.bookingUserId = userId;
            if (businessId) filterConditions.businessId = businessId;
            if (typeof active === "number") filterConditions.active = active;

            // Date filter (assuming bookingDate field exists in schema)
            if (bookingDate) {
                const startOfDay = new Date(`${bookingDate}T00:00:00.000Z`);
                const endOfDay = new Date(`${bookingDate}T23:59:59.999Z`);
                filterConditions.bookingDate = { $gte: startOfDay, $lte: endOfDay };
            }

            const options = {
                page,
                limit,
                sort: { bookingDate: -1 }, // latest booking first
                populate: [
                    {
                        path: "business",
                        select: "_id businessName",
                    },
                    {
                        path: "serviceInfo",
                        select: "_id name price",
                        as: "serviceInfo",
                    },
                    {
                        path: "bookingUser",
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
