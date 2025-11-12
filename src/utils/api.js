// api.js

// -- FIX THIS LINE --
// const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000"
// -- TO THIS --
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000"

export async function apiCall(endpoint, options = {}) {
  const { method = "GET", body = null, headers = {}, isFormData = false } = options
  
  try {
    const config = {
      method,
      headers: {
        ...(!isFormData && { "Content-Type": "application/json" }),
        ...headers,
      },
    }

    if (body && method !== "GET") {
      // For FormData, let the browser set the Content-Type
      config.body = isFormData ? body : JSON.stringify(body)
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

    // Check if response is JSON before trying to parse
    const contentType = response.headers.get("content-type")
    const isJson = contentType && contentType.includes("application/json")

    if (!response.ok) {
      if (isJson) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      } else {
        // Server returned HTML or other non-JSON (likely an error page)
        const text = await response.text()
        console.error("Server returned non-JSON error:", text.substring(0, 200))
        throw new Error(`Server error: ${response.status}. Backend may not be running or endpoint not found.`)
      }
    }

    // Handle 204 No Content (like from a successful DELETE)
    if (response.status === 204) {
      return null;
    }

    // Parse JSON response
    if (isJson) {
      return await response.json()
    } else {
      // Successful response but not JSON
      const text = await response.text()
      console.warn("Server returned non-JSON success response:", text.substring(0, 200))
      return { message: "Success", data: text }
    }
  } catch (error) {
    console.error("[v0] API call failed:", error)
    throw error
  }
}

export const generateFlashcards = async (courseId, fileId) => {
  const response = await api.post(`/api/courses/${courseId}/files/${fileId}/flashcards`);
  return response.data;
};
