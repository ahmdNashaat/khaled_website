import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  favoriteIds: string[];
  addFavorite: (productId: string) => void;
  removeFavorite: (productId: string) => void;
  setFavorites: (productIds: string[]) => void;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  getCount: () => number;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],

      addFavorite: (productId) => {
        set((state) => {
          if (state.favoriteIds.includes(productId)) {
            return state;
          }
          return { favoriteIds: [...state.favoriteIds, productId] };
        });
      },

      removeFavorite: (productId) => {
        set((state) => ({
          favoriteIds: state.favoriteIds.filter((id) => id !== productId),
        }));
      },

      setFavorites: (productIds) => set({ favoriteIds: productIds }),

      toggleFavorite: (productId) => {
        const { favoriteIds } = get();
        if (favoriteIds.includes(productId)) {
          set({ favoriteIds: favoriteIds.filter((id) => id !== productId) });
        } else {
          set({ favoriteIds: [...favoriteIds, productId] });
        }
      },

      isFavorite: (productId) => get().favoriteIds.includes(productId),

      getCount: () => get().favoriteIds.length,

      clearFavorites: () => set({ favoriteIds: [] }),
    }),
    {
      name: 'mazaq-favorites',
    }
  )
);
