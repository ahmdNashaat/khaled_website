import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFavoritesStore } from '@/store/favoritesStore';

const dedupe = (ids: string[]) => Array.from(new Set(ids));

export const useFavoritesSync = () => {
  const { user } = useAuth();
  const favoriteIds = useFavoritesStore((state) => state.favoriteIds);
  const setFavorites = useFavoritesStore((state) => state.setFavorites);

  const lastSyncedRef = useRef<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const syncFromSupabase = async () => {
      if (!user) {
        setIsInitialized(false);
        lastSyncedRef.current = [];
        return;
      }

      try {
        const { data, error } = await supabase
          .from('favorites' as any)
          .select('product_id')
          .eq('user_id', user.id);

        if (error) throw error;

        const remoteIds = (data || []).map((row: any) => row.product_id).filter(Boolean);
        const merged = dedupe([...favoriteIds, ...remoteIds]);

        setFavorites(merged);
        lastSyncedRef.current = merged;
        setIsInitialized(true);

        const toInsert = merged.filter((id) => !remoteIds.includes(id));
        if (toInsert.length > 0) {
          await supabase
            .from('favorites' as any)
            .insert(toInsert.map((productId) => ({ user_id: user.id, product_id: productId })));
        }
      } catch (error) {
        console.error('Error syncing favorites from Supabase:', error);
        setIsInitialized(true);
      }
    };

    syncFromSupabase();
  }, [user?.id]);

  useEffect(() => {
    const syncToSupabase = async () => {
      if (!user || !isInitialized) return;

      const previous = lastSyncedRef.current;
      const added = favoriteIds.filter((id) => !previous.includes(id));
      const removed = previous.filter((id) => !favoriteIds.includes(id));

      if (added.length === 0 && removed.length === 0) return;

      try {
        if (added.length > 0) {
          await supabase
            .from('favorites' as any)
            .insert(added.map((productId) => ({ user_id: user.id, product_id: productId })));
        }

        if (removed.length > 0) {
          await supabase
            .from('favorites' as any)
            .delete()
            .eq('user_id', user.id)
            .in('product_id', removed);
        }

        lastSyncedRef.current = favoriteIds;
      } catch (error) {
        console.error('Error syncing favorites to Supabase:', error);
      }
    };

    syncToSupabase();
  }, [favoriteIds, user?.id, isInitialized]);
};
