import { Request, Response } from "express";
import { userBookingService } from "../../services/booking/userBookingServices";
import { handleValidationErrors } from "../../utils/helperUtils";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/responseUtils";
import { createBookingSchema, updateBookingSchema } from "../../validations/bookingValidation";
import mongoose from "mongoose";

export class UserBookingController {
    // CREATE Booking
    static async createBooking(req: Request, res: Response) {
        const userId = req.userId
        const roleType = req.roleType

        console.log(roleType)

        if (roleType != 0) {
            return sendErrorResponse(res, ["You are Not Authorized to create Booking"], 400);
        }


        try {
            const result = createBookingSchema.safeParse(req.body);
            if (!result.success) {
                const errorMessage = handleValidationErrors(result.error);
                return sendErrorResponse(res, [errorMessage], 400);
            }

            const payload = {
                ...result.data,
                userId: (result.data.userId),
                businessId: (result.data.businessId),
                serviceId: (result.data.serviceId),
                bookingUserId: userId,
            };

            const booking = await userBookingService.createBooking(payload);
            return sendSuccessResponse(res, ["Booking created successfully"], { booking });
        } catch (error: any) {
            return sendErrorResponse(res, [error.message], 500);
        }
    }

    // GET Booking by ID
    static async getBooking(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const booking = await userBookingService.getBookingById(id);
            if (!booking) return sendErrorResponse(res, ["Booking not found"], 404);

            return sendSuccessResponse(res, ["Booking fetched successfully"], { booking });
        } catch (error: any) {
            return sendErrorResponse(res, [error.message], 500);
        }
    }

    // GET All Bookings (Paginated)
    static async getAllBookings(req: Request, res: Response) {

        const userId = req.userId
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const { businessId } = req.query;

            const result = await userBookingService.fetchBookingsWithPagination({
                userId: userId as string,
                businessId: businessId as string,
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

            const updatedBooking = await userBookingService.updateBooking(id, result.data);
            if (!updatedBooking) return sendErrorResponse(res, ["Booking not found"], 404);

            return sendSuccessResponse(res, ["Booking updated successfully"], { booking: updatedBooking });
        } catch (error: any) {
            return sendErrorResponse(res, [error.message], 500);
        }
    }

    // DELETE Booking
    static async deleteBooking(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await userBookingService.deleteBooking(id);
            if (!deleted) return sendErrorResponse(res, ["Booking not found"], 404);

            return sendSuccessResponse(res, ["Booking deleted successfully"], {});
        } catch (error: any) {
            return sendErrorResponse(res, [error.message], 500);
        }
    }
}
