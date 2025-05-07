import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plot } from "@/lib/types";

export function usePlots() {
  // Get all plots
  const getAllPlots = () => {
    return useQuery({
      queryKey: ['/api/plots'],
      queryFn: async () => {
        const res = await fetch('/api/plots', {
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Failed to fetch plots');
        return res.json() as Promise<Plot[]>;
      },
    });
  };

  // Get available plots
  const getAvailablePlots = () => {
    return useQuery({
      queryKey: ['/api/plots/available'],
      queryFn: async () => {
        const res = await fetch('/api/plots/available', {
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Failed to fetch available plots');
        return res.json() as Promise<Plot[]>;
      },
    });
  };

  // Get a specific plot
  const getPlot = (id: number) => {
    return useQuery({
      queryKey: ['/api/plots', id],
      queryFn: async () => {
        const res = await fetch(`/api/plots/${id}`, {
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Failed to fetch plot');
        return res.json() as Promise<Plot>;
      },
      enabled: !!id,
    });
  };

  // Get plots for a specific user
  const getUserPlots = (userId: number) => {
    return useQuery({
      queryKey: ['/api/users', userId, 'plots'],
      queryFn: async () => {
        const res = await fetch(`/api/users/${userId}/plots`, {
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Failed to fetch user plots');
        return res.json() as Promise<Plot[]>;
      },
      enabled: !!userId,
    });
  };

  // Create a new plot
  const createPlot = useMutation({
    mutationFn: async (plotData: Omit<Plot, 'id'>) => {
      const res = await apiRequest('POST', '/api/plots', plotData);
      return res.json() as Promise<Plot>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plots'] });
    },
  });

  // Update a plot
  const updatePlot = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<Plot>) => {
      const res = await apiRequest('PUT', `/api/plots/${id}`, data);
      return res.json() as Promise<Plot>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/plots'] });
      queryClient.invalidateQueries({ queryKey: ['/api/plots', variables.id] });
    },
  });

  return {
    getAllPlots,
    getAvailablePlots,
    getPlot,
    getUserPlots,
    createPlot,
    updatePlot,
  };
}
