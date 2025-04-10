import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { API_URL } from '@/config';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../theme';

type FavoriteMovie = {
  id: number;
  movieId: number;
  title: string;
  overview: string;
  posterPath: string;
};

type FavoriteMoviesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function FavoriteMoviesScreen() {
  const navigation = useNavigation<FavoriteMoviesScreenNavigationProp>();
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();
  const { t } = useTranslation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t('movies.favorites'),
    });
  }, [navigation, t]);

  const fetchFavorites = async () => {
    console.log('FavoritesScreen - Starting fetchFavorites');
    console.log('FavoritesScreen - Current language:', language);
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('FavoritesScreen - Token status:', token ? 'Token exists' : 'No token found');
      
      if (!token) {
        console.log('FavoritesScreen - No token found, redirecting to login');
        navigation.navigate('Login');
        return;
      }

      console.log('FavoritesScreen - Fetching favorites from API:', `${API_URL}/movies/favorites`);
      // First get the list of favorite movie IDs
      const response = await axios.get(`${API_URL}/movies/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('FavoritesScreen - API response:', {
        status: response.status,
        favoritesCount: response.data.data.favorites.length
      });

      // Then fetch updated movie details for each favorite in the current language
      console.log('FavoritesScreen - Fetching movie details for favorites');
      const favoriteMovies = await Promise.all(
        response.data.data.favorites.map(async (fav: FavoriteMovie) => {
          try {
            console.log('FavoritesScreen - Fetching details for movie:', fav.movieId);
            const movieResponse = await axios.get(
              `https://api.themoviedb.org/3/movie/${fav.movieId}?api_key=${process.env.EXPO_PUBLIC_TMDB_API_KEY}&language=${language === 'pt' ? 'pt-BR' : 'en-US'}`
            );
            console.log('FavoritesScreen - Movie details fetched:', {
              movieId: fav.movieId,
              title: movieResponse.data.title,
              hasOverview: !!movieResponse.data.overview,
              hasPoster: !!movieResponse.data.poster_path
            });
            return {
              ...fav,
              title: movieResponse.data.title,
              overview: movieResponse.data.overview,
              posterPath: movieResponse.data.poster_path,
            };
          } catch (error) {
            console.error(`FavoritesScreen - Error fetching movie ${fav.movieId} details:`, error);
            return fav; // Return original data if fetch fails
          }
        })
      );

      console.log('FavoritesScreen - Setting favorites state:', {
        count: favoriteMovies.length,
        firstMovie: favoriteMovies[0] ? {
          id: favoriteMovies[0].id,
          title: favoriteMovies[0].title
        } : null
      });
      setFavorites(favoriteMovies);
    } catch (error) {
      console.error('FavoritesScreen - Error in fetchFavorites:', error);
      if (axios.isAxiosError(error)) {
        console.error('FavoritesScreen - Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
      Alert.alert(t('errors.unexpectedError'), t('errors.tryAgain'));
    } finally {
      console.log('FavoritesScreen - Setting loading to false');
      setLoading(false);
    }
  };

  // Fetch favorites when screen is focused or language changes
  useFocusEffect(
    React.useCallback(() => {
      console.log('FavoritesScreen - Screen focused, fetching favorites');
      fetchFavorites();
    }, [language])
  );

  const removeFavorite = async (movieId: number) => {
    console.log('FavoritesScreen - Removing favorite:', movieId);
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('FavoritesScreen - Token status for remove:', token ? 'Token exists' : 'No token found');
      
      if (!token) {
        console.log('FavoritesScreen - No token found for remove, redirecting to login');
        navigation.navigate('Login');
        return;
      }

      console.log('FavoritesScreen - Sending delete request to:', `${API_URL}/movies/favorites/${movieId}`);
      await axios.delete(`${API_URL}/movies/favorites/${movieId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('FavoritesScreen - Successfully removed favorite');

      setFavorites(favorites.filter((fav) => fav.movieId !== movieId));
      console.log('FavoritesScreen - Updated favorites state:', {
        newCount: favorites.length - 1
      });
    } catch (error) {
      console.error('FavoritesScreen - Error removing favorite:', error);
      if (axios.isAxiosError(error)) {
        console.error('FavoritesScreen - Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
      Alert.alert(t('errors.unexpectedError'), t('errors.tryAgain'));
    }
  };

  const renderFavoriteMovie = ({ item }: { item: FavoriteMovie }) => (
    <View style={styles.movieCard}>
      <TouchableOpacity
        onPress={() => navigation.navigate('MovieDetails', { movieId: item.movieId })}
      >
        <Image
          style={styles.poster}
          source={{
            uri: `https://image.tmdb.org/t/p/w500${item.posterPath}`,
          }}
        />
      </TouchableOpacity>
      <View style={styles.movieInfo}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.overview} numberOfLines={3}>
          {item.overview}
        </Text>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFavorite(item.movieId)}
        >
          <Text style={styles.removeButtonText}>{t('movies.removeFromFavorites')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t('movies.noFavorites')}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={favorites}
      renderItem={renderFavoriteMovie}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.large,
  },
  emptyText: {
    fontSize: FONT_SIZE.large,
    color: COLORS.text,
    textAlign: 'center',
  },
  movieCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.medium,
    marginBottom: SPACING.medium,
    ...SHADOWS.medium,
  },
  poster: {
    width: 100,
    height: 150,
    borderTopLeftRadius: BORDER_RADIUS.medium,
    borderBottomLeftRadius: BORDER_RADIUS.medium,
  },
  movieInfo: {
    flex: 1,
    padding: SPACING.medium,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: FONT_SIZE.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.small,
  },
  overview: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text,
    marginBottom: SPACING.medium,
  },
  removeButton: {
    backgroundColor: COLORS.error,
    padding: SPACING.small,
    borderRadius: BORDER_RADIUS.small,
    alignItems: 'center',
  },
  removeButtonText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.small,
    fontWeight: 'bold',
  },
}); 