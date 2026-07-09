// File Path: client/src/services/api.jsx
const BASE_URL = import.meta.env.BACKEND_URL || "http://localhost:3000/api/v1";

// AUTH ENDPOINTS
export const endpoints = {
    SENDOTP_API: BASE_URL + "/auth/sendOTP",
    SIGNUP_API: BASE_URL + "/auth/signup",
    LOGIN_API: BASE_URL + "/auth/login",
    LOGOUT_API: BASE_URL + "/auth/logout",
    CHANGEPASSWORD_API: BASE_URL + "/auth/changePassword",
    RESETPASSTOKEN_API: BASE_URL + "/auth/reset-password-token",
    RESETPASSWORD_API: BASE_URL + "/auth/reset-password",
};

// PROFILE ENDPOINTS
export const profileEndpoints = {
    GET_AGENT_DETAILS_API: BASE_URL + "/profile/details",
    UPDATE_AGENT_DETAILS_API: BASE_URL + "/profile/update",
    DELETE_AGENT_DETAILS_API: BASE_URL + "/profile/delete",
};

// TICKET ENDPOINTS
export const ticketEndpoints = {
    CREATE_TICKET_API: BASE_URL + "/tickets/create",
    CLOSE_TICKET_API: BASE_URL + "/tickets/close",
    TICKET_HISTORY_API: BASE_URL + "/tickets/history",
    UPLOAD_RECORDING_API: BASE_URL + "/tickets/upload-recording",
    TICKET_CONNECTION_START_API: BASE_URL + "/tickets/connection-start",
    VALIDATE_ROOM_API: BASE_URL + "/tickets/validate/:roomId",
    GET_UPLOAD_SIGNATURE_API: BASE_URL + "/tickets/upload-signature"
};