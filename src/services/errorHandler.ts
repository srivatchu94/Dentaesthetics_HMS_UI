// API Error Handler Utility

export const handleApiError = (error, navigate) => {
  console.error('API Error:', error);

  // Check for 401 Unauthorized or 403 Forbidden
  if (error.response?.status === 401 || error.response?.status === 403) {
    // Redirect to unauthorized page
    navigate('/unauthorized');
    return true; // Error was handled
  }

  // Check for 404 Not Found
  if (error.response?.status === 404) {
    navigate('/error-preview');
    return true;
  }

  // Check for 500 Server Error
  if (error.response?.status >= 500) {
    navigate('/error-preview');
    return true;
  }

  return false; // Error was not handled, let caller handle it
};

// Axios interceptor setup (add this to your apiClient.ts or main setup file)
export const setupAuthInterceptor = (axiosInstance, navigate) => {
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/unauthorized');
      }
      return Promise.reject(error);
    }
  );
};
