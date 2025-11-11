import { useState, useCallback } from "react";

/**
 * Hook for optimistic UI updates
 * Updates UI immediately while API request is in flight, then syncs with server response
 */
export function useOptimisticUpdate<T>() {
  const [optimisticData, setOptimisticData] = useState<T | null>(null);
  const [isOptimistic, setIsOptimistic] = useState(false);

  const performOptimisticUpdate = useCallback(
    async (
      optimisticValue: T,
      apiCall: () => Promise<T>,
      onSuccess?: (data: T) => void,
      onError?: (error: Error) => void
    ) => {
      // Set optimistic value immediately
      setOptimisticData(optimisticValue);
      setIsOptimistic(true);

      try {
        // Make actual API call
        const result = await apiCall();

        // Update with real data
        setOptimisticData(result);
        setIsOptimistic(false);

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (error) {
        // Revert optimistic update on error
        setOptimisticData(null);
        setIsOptimistic(false);

        if (onError) {
          onError(error as Error);
        }

        throw error;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setOptimisticData(null);
    setIsOptimistic(false);
  }, []);

  return {
    optimisticData,
    isOptimistic,
    performOptimisticUpdate,
    reset,
  };
}

/**
 * Hook for optimistic list updates (add, remove, update items)
 */
export function useOptimisticList<T extends { id: string }>() {
  const [items, setItems] = useState<T[]>([]);
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());

  const addOptimistic = useCallback(
    async (
      newItem: T,
      apiCall: () => Promise<T>,
      onSuccess?: (data: T) => void,
      onError?: (error: Error) => void
    ) => {
      // Add to list immediately
      setItems((prev) => [newItem, ...prev]);
      setPendingOperations((prev) => new Set(prev).add(newItem.id));

      try {
        const result = await apiCall();

        // Update with real data
        setItems((prev) => prev.map((item) => (item.id === newItem.id ? result : item)));
        setPendingOperations((prev) => {
          const updated = new Set(prev);
          updated.delete(newItem.id);
          return updated;
        });

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (error) {
        // Remove on error
        setItems((prev) => prev.filter((item) => item.id !== newItem.id));
        setPendingOperations((prev) => {
          const updated = new Set(prev);
          updated.delete(newItem.id);
          return updated;
        });

        if (onError) {
          onError(error as Error);
        }

        throw error;
      }
    },
    []
  );

  const removeOptimistic = useCallback(
    async (
      itemId: string,
      apiCall: () => Promise<void>,
      onSuccess?: () => void,
      onError?: (error: Error) => void
    ) => {
      // Store removed item in case we need to restore
      const removedItem = items.find((item) => item.id === itemId);

      // Remove immediately
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      setPendingOperations((prev) => new Set(prev).add(itemId));

      try {
        await apiCall();

        setPendingOperations((prev) => {
          const updated = new Set(prev);
          updated.delete(itemId);
          return updated;
        });

        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        // Restore on error
        if (removedItem) {
          setItems((prev) => [removedItem, ...prev]);
        }
        setPendingOperations((prev) => {
          const updated = new Set(prev);
          updated.delete(itemId);
          return updated;
        });

        if (onError) {
          onError(error as Error);
        }

        throw error;
      }
    },
    [items]
  );

  const updateOptimistic = useCallback(
    async (
      itemId: string,
      updates: Partial<T>,
      apiCall: () => Promise<T>,
      onSuccess?: (data: T) => void,
      onError?: (error: Error) => void
    ) => {
      // Store original in case we need to restore
      const originalItem = items.find((item) => item.id === itemId);

      // Update immediately
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
      );
      setPendingOperations((prev) => new Set(prev).add(itemId));

      try {
        const result = await apiCall();

        // Update with real data
        setItems((prev) => prev.map((item) => (item.id === itemId ? result : item)));
        setPendingOperations((prev) => {
          const updated = new Set(prev);
          updated.delete(itemId);
          return updated;
        });

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (error) {
        // Restore on error
        if (originalItem) {
          setItems((prev) =>
            prev.map((item) => (item.id === itemId ? originalItem : item))
          );
        }
        setPendingOperations((prev) => {
          const updated = new Set(prev);
          updated.delete(itemId);
          return updated;
        });

        if (onError) {
          onError(error as Error);
        }

        throw error;
      }
    },
    [items]
  );

  const isPending = useCallback(
    (itemId: string) => {
      return pendingOperations.has(itemId);
    },
    [pendingOperations]
  );

  return {
    items,
    setItems,
    addOptimistic,
    removeOptimistic,
    updateOptimistic,
    isPending,
  };
}
