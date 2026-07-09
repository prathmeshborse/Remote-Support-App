// File path: client/src/services/operations/ticketAPI.js
import axios from "axios";
import { apiconnector } from "../apiconnctor";
import { ticketEndpoints } from "../api";

const {
    CREATE_TICKET_API,
    CLOSE_TICKET_API,
    TICKET_HISTORY_API,
    UPLOAD_RECORDING_API,
    TICKET_CONNECTION_START_API,
    VALIDATE_ROOM_API,
    GET_UPLOAD_SIGNATURE_API
} = ticketEndpoints;

/**
 * Service to generate a support ticket and dispatch email invitation
 */
export const createTicket = async (clientName, clientEmail) => {
    const response = await apiconnector("POST", CREATE_TICKET_API, { clientName, clientEmail });
    if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Failed to generate support ticket.");
    }
    return response.data;
};

/**
 * Service to retrieve historical support tickets for dashboard metrics
 */
export const getAgentTicketsHistory = async () => {
    const response = await apiconnector("GET", TICKET_HISTORY_API);
    if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Failed to fetch ticket history.");
    }
    return response.data;
};

/**
 * Public Service to validate a shared link's resolution and age on room load
 */
export const validateSupportRoom = async (roomId) => {
    // Dynamically inject the roomId route parameter
    const url = VALIDATE_ROOM_API.replace(":roomId", roomId);
    const response = await apiconnector("GET", url);
    if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Support link validation failed.");
    }
    return response.data;
};

/**
 * Service to initialize and register an active P2P connection segment
 */
export const startConnectionSession = async (roomId, deviceSpecs) => {
    const response = await apiconnector("POST", TICKET_CONNECTION_START_API, { roomId, deviceSpecs });
    if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Failed to register connection attempt.");
    }
    return response.data;
};

/**
 * Service to fetch a timed cryptographic upload permission signature
 */
export const getUploadSignature = async () => {
    const response = await apiconnector("GET", GET_UPLOAD_SIGNATURE_API);
    if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Failed to obtain secure upload signature.");
    }
    return response.data;
};

/**
 * Service to push raw binary files directly from browser memory to Cloudinary servers
 * (Uses native axios to prevent forwarding Express authentication cookies to Cloudinary)
 */
export const uploadVideoToCloudinaryDirect = async (file, signature, timestamp, apiKey, folder, cloudName) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("signature", signature);
    formData.append("timestamp", timestamp);
    formData.append("api_key", apiKey);
    formData.append("folder", folder);

    // Call Cloudinary's public media upload API
    const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        }
    );
    return response.data;
};

/**
 * Service to register the successfully uploaded Cloudinary video coordinates inside MongoDB
 */
export const saveConnectionRecordingMetadata = async (payload) => {
    // Expects { roomId, connectionId, url, publicId, startedAt, endedAt, duration }
    const response = await apiconnector("POST", UPLOAD_RECORDING_API, payload);
    if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Failed to save video metadata to connection history.");
    }
    return response.data;
};

/**
 * Service to update overall ticket resolution specs and close the session
 */
export const closeSupportTicket = async (roomId, overallStatus, agentNotes) => {
    const response = await apiconnector("PUT", CLOSE_TICKET_API, { roomId, overallStatus, agentNotes });
    if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Failed to close support ticket.");
    }
    return response.data;
};