import { QueryClient, DefaultOptions, QueryFunction } from '@tanstack/react-query';
import apiPath from './config';

// This helper function builds the full URL safely
const buildUrl = (path: string) => {
  // Use centralized apiPath helper which respects VITE_API_URL
  const result = apiPath('/' + path);
  console.log('Built URL via apiPath:', result);
  return result;
};


const getQueryFn: QueryFunction = async ({ queryKey }) => {
  // Join the parts of the query key to form a path, converting all elements to strings
  // e.g., ['api', 'portals'] becomes 'api/portals'
  // e.g., ['api', {id: 1}] becomes 'api/[object Object]' (but should be avoided)
  const path = queryKey.map(key => String(key)).join('/');
  
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