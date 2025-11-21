import { Service } from "../../models/serviceModel";
import { IService } from "../../interfaces/serviceInterface";
import paginate from "mongoose-paginate-v2";

export class AdminBusinessService {
    // CREATE
    static async createService(serviceData: Partial<IService>) {
        try {
            const newService = await Service.create(serviceData);
            return newService;
        } catch (error) {
            throw error;
        }
    }

    // READ One
    static async getServiceById(serviceId: string) {
        try {
            const service = await Service.findById(serviceId).populate({
                path: "servicePhoto",
                select: "url key",
            });
            return service;
        } catch (error) {
            throw error;
        }
    }

    // READ All
    static async fetchServicesWithPagination({
        page = 1,
        limit = 10,
        search = "",
    }: {

        page?: number;
        limit?: number;
        search?: string;
    }) {
        try {
            const filterConditions: any = {};

            if (search) {
                filterConditions.name = { $regex: search, $options: "i" };
            }

            const options = {
                page,
                limit,
                sort: { createdAt: -1 },
                select: [
                    "_id",
                    "name",
                    "description",
                    "servicePhotoId",
                    "price",
                    "userId",
                    "businessId",
                    "createdAt",
                ],
                populate: {
                    path: "servicePhoto", // 👈 make sure this matches the field name in your schema
                    select: "url key",
                },
            };

            const services = await Service.paginate(filterConditions, options);

            return {
                services: services.docs,
                pagination: {
                    page: services.page,
                    totalPages: services.totalPages,
                    totalDocs: services.totalDocs,
                    limit: services.limit,
                },
            };
        } catch (error) {
            throw error;
        }
    }

    // UPDATE
    static async updateService(serviceId: string, updateData: Partial<IService>) {
        try {
            const updated = await Service.findByIdAndUpdate(serviceId, updateData, {
                new: true,
            });
            return updated;
        } catch (error) {
            throw error;
        }
    }

    // DELETE
    static async deleteService(serviceId: string) {
        try {
            const deleted = await Service.findByIdAndDelete(serviceId);
            return deleted;
        } catch (error) {
            throw error;
        }
    }

    // Format Data

    static async formattedData(data: any) {
        try {
            console.log("Raw incoming data keys:", Object.keys(data));

            // 🔹 Normalize keys (trim whitespace)
            const cleanedData: Record<string, any> = {};
            for (const [key, value] of Object.entries(data)) {
                cleanedData[key.trim()] = value;
            }

            // 🔹 Only allow specific fields
            const payload: Record<string, any> = {};
            const fields = ["name", "description", "removePhoto", "price"];

            for (const key of fields) {
                const value = cleanedData[key];
                if (value !== undefined && value !== "" && value !== null) {
                    payload[key] = value;
                }
            }

            return payload;
        } catch (error) {
            console.error("Error formatting data:", error);
            throw new Error("Failed to format data");
        }
    }
}
