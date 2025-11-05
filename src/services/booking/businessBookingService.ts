import { Booking } from "../../models/bookingModel";
import { BookingInterfase } from "../../interfaces/bookingInterface";
import { formatToUTC } from "../../utils/helperUtils";
import { populate } from "dotenv";

export class businessBookingService {
    // CREATE


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

            if (userId) filterConditions.userId = userId;

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

}
