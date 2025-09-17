import { QueryClient, DefaultOptions } from '@tanstack/react-query';

// This helper function builds the full URL safely
const buildUrl = (path: string) => {
  // Get the base URL from the environment variable. Default to an empty string if not set.
  const baseUrl = import.meta.env.VITE_API_BASE || '';
  // Use the URL constructor to safely join the base URL and the path
  return new URL(path, baseUrl).toString();
};


const getQueryFn = async <T>({ queryKey }: { queryKey: (string | number)[] }): Promise<T> => {
  // Join the parts of the query key to form a path, e.g., ['api', 'portals'] becomes 'api/portals'
  const path = queryKey.join('/');
  
  // Build the full, correct URL
  const fullUrl = buildUrl(path);

  const response = await fetch(fullUrl);

  if (!response.ok) {
    throw new Error(`Network response was not ok. Status: ${response.status}`);
  }
  return response.json() as Promise<T>;
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