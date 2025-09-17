import { QueryClient, DefaultOptions, QueryFunction } from '@tanstack/react-query';

// This helper function builds the full URL safely
const buildUrl = (path: string) => {
  // Get the base URL from the environment variable. Default to an empty string if not set.
  const baseUrl = import.meta.env.VITE_API_BASE || '';

  console.log('buildUrl called with:', { path, baseUrl, env: import.meta.env.VITE_API_BASE });

  // If no base URL is set, assume we're in development and use localhost
  if (!baseUrl) {
    const result = `http://localhost:3005/${path}`;
    console.log('No baseUrl, using localhost:', result);
    return result;
  }

  // Ensure baseUrl doesn't end with slash
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');

  // Ensure path starts with slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Combine them safely
  const result = `${cleanBaseUrl}${cleanPath}`;
  console.log('Built URL:', result);
  return result;
};


const getQueryFn: QueryFunction = async ({ queryKey }) => {
  // Join the parts of the query key to form a path, e.g., ['api', 'portals'] becomes 'api/portals'
  const path = queryKey.join('/');
  
  // Build the full, correct URL
  const fullUrl = buildUrl(path);

  console.log('Making API request to:', fullUrl);

  const response = await fetch(fullUrl);

  if (!response.ok) {
    console.error(`API request failed: ${response.status} ${response.statusText} for URL: ${fullUrl}`);
    throw new Error(`Network response was not ok. Status: ${response.status}`);
  }
  return response.json();
};

const queryConfig: { defaultOptions: DefaultOptions } = {
  defaultOptions: {
    queries: {
      queryFn: getQueryFn,
      retry: 2, // Will retry failed requests 2 times
    },
  },
};

export const queryClient = new QueryClient(queryConfig);