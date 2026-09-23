import axios from "axios";

// Dynamically use the server IP in production, or fallback to localhost for development
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // REQUIRED — tells axios to send/receive httpOnly cookies
});

export default api;