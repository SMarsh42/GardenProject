import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Application } from "@/lib/types";

export function useApplications() {
  // Get all applications
  const getAllApplications = () => {
    return useQuery({
      queryKey: ['/api/applications'],
      queryFn: async () => {
        const res = await fetch('/api/applications', {
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Failed to fetch applications');
        return res.json() as Promise<Application[]>;
      },
    });
  };

  // Get pending applications
  const getPendingApplications = () => {
    return useQuery({
      queryKey: ['/api/applications/pending'],
      queryFn: async () => {
        const res = await fetch('/api/applications/pending', {
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Failed to fetch pending applications');
        return res.json() as Promise<Application[]>;
      },
    });
  };

  // Get a specific application
  const getApplication = (id: number) => {
    return useQuery({
      queryKey: ['/api/applications', id],
      queryFn: async () => {
        const res = await fetch(`/api/applications/${id}`, {
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Failed to fetch application');
        return res.json() as Promise<Application>;
      },
      enabled: !!id,
    });
  };

  // Get applications for a specific user
  const getUserApplications = (userId: number) => {
    return useQuery({
      queryKey: ['/api/users', userId, 'applications'],
      queryFn: async () => {
        const res = await fetch(`/api/users/${userId}/applications`, {
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Failed to fetch user applications');
        return res.json() as Promise<Application[]>;
      },
      enabled: !!userId,
    });
  };

  // Create a new application
  const createApplication = useMutation({
    mutationFn: async (applicationData: Omit<Application, 'id' | 'appliedDate'>) => {
      const res = await apiRequest('POST', '/api/applications', applicationData);
      return res.json() as Promise<Application>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
    },
  });

  // Update an application (for managers to approve/reject)
  const updateApplication = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<Application>) => {
      const res = await apiRequest('PUT', `/api/applications/${id}`, data);
      return res.json() as Promise<Application>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications', variables.id] });
      // Also invalidate plots if we're updating status (in case a plot is assigned)
      queryClient.invalidateQueries({ queryKey: ['/api/plots'] });
    },
  });

  return {
    getAllApplications,
    getPendingApplications,
    getApplication,
    getUserApplications,
    createApplication,
    updateApplication,
  };
}
