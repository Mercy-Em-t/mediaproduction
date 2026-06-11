import { useQuery, useMutation } from '@tanstack/react-query';
import * as api from '../api/client.js';
import { useProjectStore } from '../store/projectStore.js';

/**
 * Hook for project queries and mutations
 */
export function useProject(projectId) {
  const userId = useProjectStore((s) => s.userId);
  
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.projects.get(userId, projectId),
    enabled: !!userId && !!projectId,
  });
}

/**
 * Hook for listing all user projects
 */
export function useProjects() {
  const userId = useProjectStore((s) => s.userId);
  
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => api.projects.getAll(userId),
    enabled: !!userId,
  });
}

/**
 * Hook for file upload mutation
 */
export function useFileUpload() {
  const userId = useProjectStore((s) => s.userId);
  const currentProjectId = useProjectStore((s) => s.currentProjectId);
  const setUploadProgress = useProjectStore((s) => s.setUploadProgress);
  const addNotification = useProjectStore((s) => s.addNotification);

  return useMutation({
    mutationFn: async (payload) => {
      const { files, versionStage } = payload;
      
      // Simulate upload progress
      files.forEach((file, idx) => {
        setUploadProgress(idx, 0);
      });

      return api.files.upload(userId, currentProjectId, files, versionStage);
    },
    onSuccess: () => {
      addNotification({
        type: 'success',
        message: 'Files uploaded successfully',
        duration: 3000,
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: `Upload failed: ${error.message}`,
        duration: 5000,
      });
    },
  });
}

/**
 * Hook for file list queries
 */
export function useFileList(projectId) {
  const userId = useProjectStore((s) => s.userId);
  
  return useQuery({
    queryKey: ['files', projectId],
    queryFn: () => api.files.list(userId, projectId),
    enabled: !!userId && !!projectId,
  });
}

/**
 * Hook for scene creation
 */
export function useCreateScene() {
  const userId = useProjectStore((s) => s.userId);
  const currentProjectId = useProjectStore((s) => s.currentProjectId);
  const addNotification = useProjectStore((s) => s.addNotification);

  return useMutation({
    mutationFn: (payload) =>
      api.scenes.create(userId, currentProjectId, payload.title, payload.outline),
    onSuccess: () => {
      addNotification({
        type: 'success',
        message: 'Scene created successfully',
        duration: 3000,
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: `Failed to create scene: ${error.message}`,
        duration: 5000,
      });
    },
  });
}

/**
 * Hook for task creation
 */
export function useCreateTask() {
  const userId = useProjectStore((s) => s.userId);
  const currentProjectId = useProjectStore((s) => s.currentProjectId);
  const addNotification = useProjectStore((s) => s.addNotification);

  return useMutation({
    mutationFn: (payload) =>
      api.tasks.create(userId, currentProjectId, payload),
    onSuccess: () => {
      addNotification({
        type: 'success',
        message: 'Task created successfully',
        duration: 3000,
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: `Failed to create task: ${error.message}`,
        duration: 5000,
      });
    },
  });
}

/**
 * Hook for rubric queries
 */
export function useRubrics(projectId) {
  const userId = useProjectStore((s) => s.userId);
  
  return useQuery({
    queryKey: ['rubrics', projectId],
    queryFn: () => api.rubrics.list(userId, projectId),
    enabled: !!userId && !!projectId,
  });
}

/**
 * Hook for assigned reviews
 */
export function useAssignedReviews() {
  const userId = useProjectStore((s) => s.userId);
  const currentProjectId = useProjectStore((s) => s.currentProjectId);
  
  return useQuery({
    queryKey: ['assignedReviews', currentProjectId],
    queryFn: () => api.reviews.getAssigned(userId, currentProjectId),
    enabled: !!userId && !!currentProjectId,
  });
}

/**
 * Hook for review submission
 */
export function useSubmitReview() {
  const userId = useProjectStore((s) => s.userId);
  const currentProjectId = useProjectStore((s) => s.currentProjectId);
  const addNotification = useProjectStore((s) => s.addNotification);

  return useMutation({
    mutationFn: (payload) =>
      api.reviews.submit(userId, currentProjectId, payload),
    onSuccess: () => {
      addNotification({
        type: 'success',
        message: 'Review submitted successfully',
        duration: 3000,
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: `Failed to submit review: ${error.message}`,
        duration: 5000,
      });
    },
  });
}
