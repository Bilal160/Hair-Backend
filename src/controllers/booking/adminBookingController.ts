import { Request, Response } from "express";
import { userBookingService } from "../../services/booking/userBookingServices";
import { handleValidationErrors } from "../../utils/helperUtils";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/responseUtils";
import { createBookingSchema, updateBookingSchema } from "../../validations/bookingValidation";
import mongoose from "mongoose";
import { formatToUTC } from "../../utils/helperUtils";
import { businessBookingService } from "../../services/booking/businessBookingService";
import { AdminbusinessBookingService } from "../../services/booking/adminBookingService";

export class AdminBusinessBookingController {
    // CREATE Booking


    // GET Booking by ID
    static async getBooking(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const booking = await AdminbusinessBookingService.getBookingById(id);
            if (!booking) return sendErrorResponse(res, ["Booking not found"], 404);

            return sendSuccessResponse(res, ["Booking fetched successfully"], { booking });
        } catch (error: any) {
            return sendErrorResponse(res, [error.message], 500);
        }
    }

    // GET All Bookings (Paginated)
    static async getAllBookings(req: Request, res: Response) {


        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const { businessId, active, bookingDate } = req.query;

            const result = await AdminbusinessBookingService.fetchBookingsWithPagination({
                businessId: businessId as string,
                bookingStatus: Number(active) || undefined,
                bookingDate: bookingDate as string,
                page,
                limit,
            });

            return sendSuccessResponse(res, ["Bookings fetched successfully"], result);
        } catch (error: any) {
            return sendErrorResponse(res, [error.message], 500);
        }
    }


    // UPDATE Booking
    static async updateBooking(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = updateBookingSchema.safeParse(req.body);

            if (!result.success) {
                const errorMessage = handleValidationErrors(result.error);
                return sendErrorResponse(res, [errorMessage], 400);
            }

            const updatedBooking = await AdminbusinessBookingService.updateBooking(id, result.data);
            if (!updatedBooking) return sendErrorResponse(res, ["Booking not found"], 404);

            return sendSuccessResponse(res, ["Booking updated successfully"], { booking: updatedBooking });
        } catch (error: any) {
            return sendErrorResponse(res, [error.message], 500);
        }
    }

    // DELETE Booking

}
