import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Movie } from '../types/movie';

type FavoritesContextType = {
  favorites: Movie[];
  addFavorite: (movie: Movie) => Promise<void>;
  removeFavorite: (movie: Movie) => Promise<void>;
  isFavorite: (movieId: number) => boolean;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Movie[]>([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const savedFavorites = await AsyncStorage.getItem('favorites');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const saveFavorites = async (newFavorites: Movie[]) => {
    try {
      await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const addFavorite = async (movie: Movie) => {
    const newFavorites = [...favorites, movie];
    setFavorites(newFavorites);
    await saveFavorites(newFavorites);
  };

  const removeFavorite = async (movie: Movie) => {
    const newFavorites = favorites.filter(f => f.id !== movie.id);
    setFavorites(newFavorites);
    await saveFavorites(newFavorites);
  };

  const isFavorite = (movieId: number) => {
    return favorites.some(f => f.id === movieId);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}; 