/**
 * Global click handler for .js-open-expedia elements
 * Enables destination cards to open the Expedia modal
 */
export function initExpediaModalHandler() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  
  const handler = (e: MouseEvent) => {
    const trigger = (e.target as Element).closest('.js-open-expedia');
    if (trigger) {
      e.preventDefault();
      e.stopPropagation();
      
      // Get destination from data attribute if available
      const destination = trigger.getAttribute('data-destination');
      
      // Dispatch custom event that ExpediaModalContext can listen to
      const event = new CustomEvent('openExpediaModal', { 
        detail: { destination } 
      });
      window.dispatchEvent(event);
      
      console.log('[ExpediaModal] Card click detected:', destination);
    }
  };
  
  document.addEventListener('click', handler);
  console.log('[ExpediaModal] Global click handler registered');
  
  return () => document.removeEventListener('click', handler);
}
