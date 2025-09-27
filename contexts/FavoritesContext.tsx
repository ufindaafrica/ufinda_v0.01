import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  favorites: string[];
  isFavorite: (listingId: string) => boolean;
  toggleFavorite: (listingId: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const API_BASE_URL = 'http://localhost:3000/api';
  const LOCAL_FAVORITES_KEY = 'local_favorites';

  // Get user token from AsyncStorage
  const getToken = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  // Load local favorites from AsyncStorage
  const loadLocalFavorites = useCallback(async (): Promise<string[]> => {
    try {
      const localFavorites = await AsyncStorage.getItem(LOCAL_FAVORITES_KEY);
      return localFavorites ? JSON.parse(localFavorites) : [];
    } catch (error) {
      console.error('Error loading local favorites:', error);
      return [];
    }
  }, []);

  // Save favorites to AsyncStorage
  const saveLocalFavorites = useCallback(async (favoriteIds: string[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(favoriteIds));
    } catch (error) {
      console.error('Error saving local favorites:', error);
    }
  }, []);

  // Sync local favorites with backend when user logs in
  const syncFavoritesWithBackend = useCallback(async (localFavorites: string[]): Promise<void> => {
    const token = await getToken();
    if (!token || !user) return;

    try {
      setLoading(true);

      // First, get current backend favorites
      const response = await fetch(`${API_BASE_URL}/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let backendFavorites: string[] = [];
      if (response.ok) {
        const data = await response.json();
        backendFavorites = data.favorites.map((fav: any) => fav.listing_id.toString());
      }

      // Merge local and backend favorites
      const mergedFavorites = [...new Set([...localFavorites, ...backendFavorites])];

      // Update backend with any local favorites that aren't there
      for (const listingId of localFavorites) {
        if (!backendFavorites.includes(listingId)) {
          await fetch(`${API_BASE_URL}/favorites`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ listingId }),
          });
        }
      }

      // Update local state
      setFavorites(mergedFavorites);
      await saveLocalFavorites(mergedFavorites);
    } catch (error) {
      console.error('Error syncing favorites:', error);
      // If sync fails, keep local favorites
      setFavorites(localFavorites);
    } finally {
      setLoading(false);
    }
  }, [user, saveLocalFavorites]);

  // Fetch favorites (local or backend)
  const refreshFavorites = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const localFavorites = await loadLocalFavorites();
      
      if (user) {
        // User is logged in: sync with backend
        await syncFavoritesWithBackend(localFavorites);
      } else {
        // No user: use local favorites only
        setFavorites(localFavorites);
      }
    } catch (error) {
      console.error('Error refreshing favorites:', error);
      // Fallback to local favorites
      const localFavorites = await loadLocalFavorites();
      setFavorites(localFavorites);
    } finally {
      setLoading(false);
    }
  }, [user, loadLocalFavorites, syncFavoritesWithBackend]);

  // Check if a listing is favorited
  const isFavorite = useCallback((listingId: string): boolean => {
    return favorites.includes(listingId);
  }, [favorites]);

  // Toggle favorite status (works locally and syncs with backend if logged in)
  const toggleFavorite = useCallback(async (listingId: string): Promise<void> => {
    try {
      const isCurrentlyFavorite = isFavorite(listingId);
      let newFavorites: string[];
      
      if (isCurrentlyFavorite) {
        // Remove from favorites
        newFavorites = favorites.filter(id => id !== listingId);
      } else {
        // Add to favorites
        newFavorites = [...favorites, listingId];
      }

      // Update local state immediately
      setFavorites(newFavorites);
      await saveLocalFavorites(newFavorites);

      // If user is logged in, also update backend
      if (user) {
        const token = await getToken();
        if (token) {
          try {
            if (isCurrentlyFavorite) {
              // Remove from backend
              await fetch(`${API_BASE_URL}/favorites/${listingId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });
            } else {
              // Add to backend
              await fetch(`${API_BASE_URL}/favorites`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ listingId }),
              });
            }
          } catch (backendError) {
            console.log('Backend sync failed, but local favorite saved:', backendError);
            // Don't revert local changes if backend fails
          }
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [favorites, isFavorite, user, saveLocalFavorites]);

  // Initialize favorites on component mount
  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  // Sync with backend when user logs in/out
  useEffect(() => {
    if (user) {
      // User just logged in - sync local favorites with backend
      refreshFavorites();
    }
    // When user logs out, we keep local favorites
  }, [user, refreshFavorites]);

  const value: FavoritesContextType = {
    favorites,
    isFavorite,
    toggleFavorite,
    refreshFavorites,
    loading,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};