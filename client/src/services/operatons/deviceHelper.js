// File Path: client/src/services/operatons/deviceHelper.js

/**
 * Parses userAgent and vendor strings to classify Client OS and Browser details
 * @returns {{os: string, browser: string}}
 */

const getOSAndBrowser = () => {
    const userAgent = navigator.userAgent || "";
    const vendor = navigator.vendor || "";
    let os = "Unknown OS";
    let browser = "Unknown Browser";

    // 1. Classify Operating System
    if (/windows/i.test(userAgent)) {
        os = "Windows";
    } else if (/macintosh|mac os x/i.test(userAgent)) {
        os = "macOS";
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
        os = "iOS";
    } else if (/android/i.test(userAgent)) {
        os = "Android";
    } else if (/linux/i.test(userAgent)) {
        os = "Linux";
    }

    // 2. Classify Browser Type
    if (/opr/i.test(userAgent) || /opera/i.test(userAgent)) {
        browser = "Opera";
    } else if (/edg/i.test(userAgent)) {
        browser = "Edge";
    } else if (/chrome/i.test(userAgent) && /google/i.test(vendor)) {
        browser = "Chrome";
    } else if (/firefox/i.test(userAgent)) {
        browser = "Firefox";
    } else if (/safari/i.test(userAgent) && /apple/i.test(vendor)) {
        browser = "Safari";
    }

    return { os, browser };
};

/**
 * Fetches physical screen dimensions of the Client monitor
 * @returns {string} e.g. "1920x1080"
 */
const getScreenResolution = () => {
    try {
        return `${window.screen.width}x${window.screen.height}`;
    } catch (error) {
        return "Unknown Resolution";
    }
};

/**
 * Queries the browser's battery level using the HTML5 Battery Status API
 * @returns {Promise<number|null>} Battery percentage or null if unsupported
 */
const getBatteryStatus = async () => {
    // Check if the API is supported on the user's browser
    if (typeof navigator.getBattery === "function") {
        try {
            const battery = await navigator.getBattery();
            return Math.round(battery.level * 100);
        } catch (error) {
            // Safari/Firefox privacy restrictions or permissions blocks
            console.warn("Battery API is restricted or blocked by this browser's policies.");
            return null;
        }
    }
    return null; // Graceful fallback if completely unsupported
};

/**
 * Gathers client device diagnostics telemetry data using lightweight Web APIs
 * @returns {Promise<{os: string, browser: string, resolution: string, batteryLevel: number|null}>}
 */
export const getDeviceDiagnostics = async () => {
    const { os, browser } = getOSAndBrowser();
    const resolution = getScreenResolution();
    const batteryLevel = await getBatteryStatus();

    return {
        os,
        browser,
        resolution,
        batteryLevel
    };
};