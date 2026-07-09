// File path: client/src/services/apiconnctor.jsx
import axios from 'axios';

// Standardize instance with HTTP credentials support for secure JWT cookies
export const axiosInstance = axios.create({
    withCredentials: true, 
});

export const apiconnector = (method, url, bodyData, headers, params) => {
    return axiosInstance({
        method: `${method}`,
        url: `${url}`,
        data: bodyData ? bodyData : null,
        headers: headers ? headers : null,
        params: params ? params : null,
    });
};