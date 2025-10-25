// client/src/lib/api.ts

import axios from 'axios';

// Get the base URL for the backend
const getBaseUrl = () => {
  const isDevelopment = import.meta.env.DEV;
  // Based on your server/index.ts, backend runs on port 5000
  // For Replit deployments, you'll need to update the production URL
  return isDevelopment ? 'http://localhost:5000' : 'https://serviceconnect-backend.YOUR_REPLIT_USERNAME.repl.co'; // !!! REPLACE 'YOUR_REPLIT_USERNAME' !!!
};

const api = axios.create({
  baseURL: getBaseUrl(), // Your backend API base URL
  withCredentials: true, // Important for sending cookies/session with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized access - you might need to login.");
      // Optionally redirect to login page:
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;