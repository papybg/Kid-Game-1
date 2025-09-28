import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AdminItem {
  id: number;
  name: string;
  image: string;
  audio?: string; // Добавяме звук към AdminItem
  index: string;
  category: string;
}

export interface Portal {
  id: string;
  portalName: string;
  fileName: string;
  iconFileName: string;
  layouts: string[];
  cellCount: number;
  min_cells: number;
  max_cells: number;
  item_count_rule: string;
  isLocked: boolean;
}

export interface CategoryIndex {
  id: number;
  categoryName: string;
  indexValue: string;
  description: string;
}

export interface CreateItemData {
  name: string;
  index: string;
  category: string;
  image?: File;
  audio?: File; // Добавяме звук към CreateItemData
}

import apiPath from '../lib/config';

// API база URL - използвай helper, който може да бъде конфигуриран чрез VITE_API_URL
const API_BASE = apiPath('/api/admin');

// GET всички items
export const useAdminItems = () => {
  return useQuery({
    queryKey: ["admin-items"],
    queryFn: async (): Promise<AdminItem[]> => {
      const response = await fetch(`${API_BASE}/items`);
      if (!response.ok) {
        throw new Error("Failed to fetch items");
      }
      return response.json();
    },
  });
};

// GET всички категории и индекси
export const useAdminCategories = () => {
  return useQuery({
    queryKey: ["admin-categories"],
    queryFn: async (): Promise<CategoryIndex[]> => {
      const response = await fetch(`${API_BASE}/categories`);
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      return response.json();
    },
  });
};

// GET всички портали
export const useAdminPortals = () => {
  return useQuery({
    queryKey: ["admin-portals"],
    queryFn: async (): Promise<Portal[]> => {
  const response = await fetch(apiPath('/api/portals'));
      if (!response.ok) {
        throw new Error("Failed to fetch portals");
      }
      return response.json();
    },
  });
};

// POST нов item
export const useCreateItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateItemData): Promise<AdminItem> => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("index", data.index);
      formData.append("category", data.category);
      if (data.image) {
        formData.append("image", data.image);
      }
      if (data.audio) {
        formData.append("audio", data.audio); // Добавяме звука във FormData
      }

      const response = await fetch(`${API_BASE}/items`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create item");
      }
      return response.json();
    },
    onSuccess: () => {
      // Refresh items list
      queryClient.invalidateQueries({ queryKey: ["admin-items"] });
    },
  });
};

// PUT edit item  
export const useUpdateItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CreateItemData }): Promise<AdminItem> => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("index", data.index);
      formData.append("category", data.category);
      if (data.image) {
        formData.append("image", data.image);
      }
      if (data.audio) {
        formData.append("audio", data.audio);
      }

      const response = await fetch(`${API_BASE}/items/${id}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update item");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-items"] });
    },
  });
};

// POST нов category index
export const useCreateCategoryIndex = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { categoryName: string; indexValue: string; description?: string }): Promise<CategoryIndex> => {
      const response = await fetch(`${API_BASE}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create category index: ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      // Refresh categories list
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });
};

// DELETE item
export const useDeleteItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const response = await fetch(`${API_BASE}/items/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-items"] });
    },
  });
};