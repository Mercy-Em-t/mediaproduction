import { create } from 'zustand';

/**
 * Project store for managing UI state
 * - Current user and auth
 * - Current project selection
 * - UI states (upload modal, etc.)
 */
export const useProjectStore = create((set) => ({
  // User state
  userId: localStorage.getItem('userId') || '',
  setUserId: (userId) => {
    localStorage.setItem('userId', userId);
    set({ userId });
  },

  // Project state
  currentProjectId: localStorage.getItem('currentProjectId') || '',
  setCurrentProjectId: (projectId) => {
    localStorage.setItem('currentProjectId', projectId);
    set({ currentProjectId: projectId });
  },

  // UI state
  isUploadModalOpen: false,
  setUploadModalOpen: (isOpen) => set({ isUploadModalOpen: isOpen }),

  isProjectSwitcherOpen: false,
  setProjectSwitcherOpen: (isOpen) => set({ isProjectSwitcherOpen: isOpen }),

  // Upload state
  uploadProgress: {}, // { fileId: percentage }
  setUploadProgress: (fileId, percentage) =>
    set((state) => ({
      uploadProgress: { ...state.uploadProgress, [fileId]: percentage },
    })),

  // Notification state
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, { id: Date.now(), ...notification }],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
