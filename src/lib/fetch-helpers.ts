/**
 * Safe fetch helper that handles non-JSON responses
 * Throws error if response is not ok or not JSON
 */
export async function safeFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options);

    // Check if response is ok (status 200-299)
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
      } catch {
        // If we can't parse the error, use default message
      }

      throw new Error(errorMessage);
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Expected JSON response but got: ${contentType}. Response: ${text.substring(0, 100)}`);
    }

    return await response.json();
  } catch (error) {
    // Re-throw with more context if needed
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Fetch error: ${error}`);
  }
}

/**
 * Safe fetch helper specifically for API routes
 * Returns { success: boolean, data?: any, error?: string }
 */
export async function safeFetchAPI<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const result = await safeFetch<{ success: boolean; data?: T; message?: string }>(url, options);
    return {
      success: result.success,
      data: result.data,
      error: result.success ? undefined : result.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
