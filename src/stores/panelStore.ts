import { create } from "zustand";

export type PanelType = "search" | "notifications" | "messages" | null;

type PanelState = {
  open: boolean;
  type: PanelType;
  openType: (t: Exclude<PanelType, null>) => void;
  close: () => void;
  toggle: (t: Exclude<PanelType, null>) => void;
};

export const usePanelStore = create<PanelState>((set, get) => ({
  open: false,
  type: null,
  openType: (t) => set({ open: true, type: t }),
  close: () => set({ open: false, type: null }),
  toggle: (t) => {
    const { open, type } = get();
    if (open && type === t) set({ open: false, type: null });
    else set({ open: true, type: t });
  },
}));
