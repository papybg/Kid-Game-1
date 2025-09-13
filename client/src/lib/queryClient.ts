import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Build a request URL using optional VITE_API_BASE (for production builds like Netlify)
function buildUrl(path: string) {
  // Vite exposes env vars on import.meta.env; VITE_* variables are user-defined
  const rawBase = import.meta.env?.VITE_API_BASE ?? "";
  const base = String(rawBase).toString().trim().replace(/\/+$/, "");
  const cleaned = path.replace(/^\/+/, "");
  if (base) return `${base}/${cleaned}`;
  return `/${cleaned}`;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    try {
      // Try to parse as JSON first
      const json = JSON.parse(text);
      throw new Error(json.message || `${res.status}: ${res.statusText}`);
    } catch (e) {
      // If not JSON or other error, use text
      throw new Error(`${res.status}: ${text || res.statusText}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(buildUrl(url), {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`API request error for ${url}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const url = `/${queryKey.join("/").replace(/^\/+/, '')}`;
      const res = await fetch(buildUrl(url), {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      return data;
    } catch (error) {
      console.error(`Query error for ${queryKey.join("/")}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // Cache for 5 minutes by default
      gcTime: 1000 * 60 * 30, // Keep unused data in cache for 30 minutes
      retry: 2, // Retry failed requests twice
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});
