// File path: client/src/services/operations/authAPI.js
import { apiconnector } from "../apiconnctor";
import { endpoints } from "../api";

const {
    SENDOTP_API,
    LOGIN_API,
    SIGNUP_API,
    CHANGEPASSWORD_API,
    RESETPASSTOKEN_API,
    RESETPASSWORD_API,
    LOGOUT_API
} = endpoints;

/**
 * Service to request email OTP delivery
 * @param {string} email 
 */
export const sendOTP = async (email) => {
    const response = await apiconnector("POST", SENDOTP_API, { email });
    if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Failed to dispatch verification code.");
    }
    return response.data;
};

/**
 * Service to register a new Agent account
 * @param {object} formData 
 */
export const signUp = async (formData) => {
    const response = await apiconnector("POST", SIGNUP_API, formData);
    if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Registration failed.");
    }
    return response.data;
};

/**
 * Service to authenticate an Agent
 * @param {string} email 
 * @param {string} password 
 */
export const login = async (email, password) => {
    const response = await apiconnector("POST", LOGIN_API, { email, password });
    if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Login failed.");
    }
    return response.data;
};

/**
 * Service to request session cookie deletion on backend
 */
export const logout = async () => {
    const response = await apiconnector("POST", LOGOUT_API);
    if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Logout failed.");
    }
    return response.data;
};

/**
 * Service to update an Agent's password
 * @param {object} passwords 
 */
export const changePassword = async (passwords) => {
    const response = await apiconnector("POST", CHANGEPASSWORD_API, passwords);
    if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Unable to update password.");
    }
    return response.data;
};

/**
 * Service to generate and email a secure password reset link
 * @param {string} email 
 */
export const resetPasswordToken = async (email) => {
    const response = await apiconnector("POST", RESETPASSTOKEN_API, { email });
    if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Unable to send recovery email.");
    }
    return response.data;
};

/**
 * Service to submit a password reset update
 * @param {string} password 
 * @param {string} confirmPassword 
 * @param {string} token 
 */
export const resetPassword = async (password, confirmPassword, token) => {
    const response = await apiconnector("POST", RESETPASSWORD_API, { password, confirmPassword, token });
    if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Failed to reset password.");
    }
    return response.data;
};