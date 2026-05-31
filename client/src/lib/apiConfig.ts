/**
 * Central API configuration for KVCET ERP.
 * Hardcoded to the deployed Render backend.
 * Override with NEXT_PUBLIC_BACKEND_URL env var for local dev.
 */
const API_BASE_URL =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_BACKEND_URL
    ? process.env.NEXT_PUBLIC_BACKEND_URL
    : "https://kvcet-erp-backend.onrender.com";

export default API_BASE_URL;
