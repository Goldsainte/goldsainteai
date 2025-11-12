import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface ExpediaPrefill {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
}

interface ExpediaModalContextType {
  isOpen: boolean;
  prefill: ExpediaPrefill | null;
  openModal: (prefillData?: ExpediaPrefill) => void;
  closeModal: () => void;
}

const ExpediaModalContext = createContext<ExpediaModalContextType | undefined>(undefined);

export const ExpediaModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prefill, setPrefill] = useState<ExpediaPrefill | null>(null);

  const openModal = useCallback((prefillData?: ExpediaPrefill) => {
    if (prefillData) {
      setPrefill(prefillData);
      
      // Telemetry
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'chat_open_expedia_modal', {
          has_destination: !!prefillData.destination,
          has_dates: !!(prefillData.checkIn && prefillData.checkOut),
          has_guests: !!(prefillData.adults || prefillData.children),
        });
      }
    }
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Clear prefill after a delay to allow animation to complete
    setTimeout(() => setPrefill(null), 300);
  }, []);

  // Listen for custom events from global click handler
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const { destination } = e.detail || {};
      openModal(destination ? { destination } : undefined);
    };
    
    window.addEventListener('openExpediaModal' as any, handler);
    return () => window.removeEventListener('openExpediaModal' as any, handler);
  }, [openModal]);

  return (
    <ExpediaModalContext.Provider value={{ isOpen, prefill, openModal, closeModal }}>
      {children}
    </ExpediaModalContext.Provider>
  );
};

export const useExpediaModal = () => {
  const context = useContext(ExpediaModalContext);
  if (context === undefined) {
    throw new Error('useExpediaModal must be used within ExpediaModalProvider');
  }
  return context;
};
