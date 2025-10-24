// client/src/utils/api.ts

import axios from 'axios';

// Get the base URL for the backend
const getBaseUrl = () => {
  // For Replit deployments, the backend is usually on the same host but a different port,
  // or if using a different setup, it might be a specific URL.
  // For local development, it might be 'http://localhost:5000' or whatever your server runs on.
  // Check your server's package.json 'start' script or .env for port.
  // Assuming server runs on port 5000 or similar
  const isDevelopment = import.meta.env.DEV; // Vite's way to check dev environment
  return isDevelopment ? 'http://localhost:5000' : 'https://serviceconnect-backend.yourreplitusername.repl.co'; // Replace with your actual deployed backend URL
};

const api = axios.create({
  baseURL: getBaseUrl(), // Your backend API base URL
  withCredentials: true, // Important for sending cookies/session with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// You might also want to add interceptors for error handling or token refresh
// For example:
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized errors, e.g., redirect to login
      console.error("Unauthorized access - redirecting to login or refresh token");
      // window.location.href = '/login'; // Example: redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;