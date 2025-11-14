// src/utils/api.js

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

/**
 * The main API call function.
 * It automatically adds the JWT token to the header for all requests.
 */
export async function apiCall(endpoint, options = {}) {
  const { method = "GET", body = null, headers = {}, isFormData = false } = options;

  try {
    // 1. Get the token from localStorage
    const token = localStorage.getItem('authToken');
    const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

    const config = {
      method,
      headers: {
        ...(!isFormData && { "Content-Type": "application/json" }),
        ...headers,
        ...authHeaders, // 2. Add the token to the request headers
      },
    };

    if (body && method !== "GET") {
      config.body = isFormData ? body : JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // 3. If token is bad (401), log the user out automatically
      if (response.status === 401 && 
          endpoint !== '/api/login' && 
          endpoint !== '/api/register'
      ) {
          handleLogout(); // Call the logout helper
      }
      
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    if (response.status === 204) { // No Content
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`[API Call Failed] ${method} ${endpoint}:`, error);
    throw error;
  }
}

export async function apiFetchFile(endpoint) {
  const token = localStorage.getItem('authToken');
  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: { ...authHeaders }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      handleLogout();
    }
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  // 1. Get the file data as a "blob"
  const blob = await response.blob(); 
  
  // 2. Create a temporary, in-memory URL for the blob
  return URL.createObjectURL(blob);
}

// --- [NEW] Auth Helper Functions ---

/**
 * Logs the user in and saves their token and user data.
 */
export const loginUser = async (username, password) => {
  const data = await apiCall('/api/login', {
    method: 'POST',
    body: { username, password } // Send username and password
  });
  
  if (data.token) {
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
  }
  return data;
};

/**
 * Registers a new user.
 */
export const registerUser = async (username, password) => {
  return await apiCall('/api/register', {
    method: 'POST',
    body: { username, password }
  });
};

/**
 * Logs the user out by clearing their data from localStorage.
 */
export const handleLogout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  // Force a reload to the login page
  window.location.href = '/'; 
};