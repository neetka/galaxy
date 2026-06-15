"use client";

import { create } from "zustand";

interface UIState {
  isHistoryPanelOpen: boolean;
  isNodePickerOpen: boolean;
  sidebarWidth: number;

  toggleHistoryPanel: () => void;
  setHistoryPanelOpen: (open: boolean) => void;
  toggleNodePicker: () => void;
  setNodePickerOpen: (open: boolean) => void;
  setSidebarWidth: (width: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isHistoryPanelOpen: false,
  isNodePickerOpen: false,
  sidebarWidth: 340,

  toggleHistoryPanel: () =>
    set((state) => ({ isHistoryPanelOpen: !state.isHistoryPanelOpen })),

  setHistoryPanelOpen: (open) => set({ isHistoryPanelOpen: open }),

  toggleNodePicker: () =>
    set((state) => ({ isNodePickerOpen: !state.isNodePickerOpen })),

  setNodePickerOpen: (open) => set({ isNodePickerOpen: open }),

  setSidebarWidth: (width) => set({ sidebarWidth: width }),
}));
