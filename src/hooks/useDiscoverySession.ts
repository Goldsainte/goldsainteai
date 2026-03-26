import { createContext, useContext } from "react";
import { create } from "zustand";

interface DiscoveryState {
  topCategory: string;
  subcategory: string | null;
  activeTags: string[];
  lastQuery: string;
  setTopCategory: (cat: string) => void;
  setSubcategory: (sub: string | null) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  setLastQuery: (q: string) => void;
  reset: () => void;
}

export const useDiscoverySession = create<DiscoveryState>((set) => ({
  topCategory: "All",
  subcategory: null,
  activeTags: [],
  lastQuery: "",
  setTopCategory: (cat) =>
    set({ topCategory: cat, subcategory: null, activeTags: [] }),
  setSubcategory: (sub) => set({ subcategory: sub }),
  addTag: (tag) =>
    set((s) => ({
      activeTags: s.activeTags.includes(tag)
        ? s.activeTags
        : [...s.activeTags, tag],
    })),
  removeTag: (tag) =>
    set((s) => ({ activeTags: s.activeTags.filter((t) => t !== tag) })),
  setLastQuery: (q) => set({ lastQuery: q }),
  reset: () =>
    set({ topCategory: "All", subcategory: null, activeTags: [], lastQuery: "" }),
}));
