import { create } from 'zustand';

type PanelType = 'search' | 'notifications' | 'messages' | null;

interface PanelStore {
  open: boolean;
  type: PanelType;
  openType: (type: Exclude<PanelType, null>) => void;
  close: () => void;
}

export const usePanelStore = create<PanelStore>((set) => ({
  open: false,
  type: null,
  openType: (type) => set({ open: true, type }),
  close: () => set({ open: false, type: null }),
}));
