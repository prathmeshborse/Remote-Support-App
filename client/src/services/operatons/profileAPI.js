// File path: client/src/services/operations/profileAPI.js
import { apiconnector } from "../apiconnctor";
import { profileEndpoints } from "../api";

const {
    GET_AGENT_DETAILS_API,
    UPDATE_AGENT_DETAILS_API,
    DELETE_AGENT_DETAILS_API
} = profileEndpoints;

/**
 * Service to fetch complete details of the authenticated agent
 * @returns {Promise<object>} Backend response payload
 */
export const getAgentDetails = async () => {
    const response = await apiconnector("GET", GET_AGENT_DETAILS_API);
    if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Failed to fetch profile details.");
    }
    return response.data;
};

/**
 * Service to update agent account and profile specifications
 * @param {object} formData 
 * @returns {Promise<object>} Updated agent details
 */
export const updateProfile = async (formData) => {
    const response = await apiconnector("PUT", UPDATE_AGENT_DETAILS_API, formData);
    if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Failed to update profile.");
    }
    return response.data;
};

/**
 * Service to cascadingly wipe agent account data
 * @returns {Promise<object>} Status confirmation
 */
export const deleteAccount = async () => {
    const response = await apiconnector("DELETE", DELETE_AGENT_DETAILS_API);
    if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Failed to delete account.");
    }
    return response.data;
};