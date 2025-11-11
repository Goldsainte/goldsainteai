import { useExpediaModal } from '@/contexts/ExpediaModalContext';
import { CompactHeaderSearch } from './CompactHeaderSearch';

/**
 * Global Expedia modal trigger that listens to context state
 * Place this component once at the app level to enable modal control from anywhere
 */
export const ExpediaModalTrigger = () => {
  const { isOpen, prefill, closeModal } = useExpediaModal();

  return (
    <CompactHeaderSearch
      externalOpen={isOpen}
      onExternalOpenChange={closeModal}
      prefill={prefill || undefined}
    />
  );
};
