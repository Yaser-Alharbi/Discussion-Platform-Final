// Configuration utility for environment variables

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Helper function to build API endpoints
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  return `${API_BASE_URL}/api/${cleanEndpoint}`;
}; 