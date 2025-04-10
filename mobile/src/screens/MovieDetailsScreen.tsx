/* eslint-disable react-native/no-color-literals */
import React, { useEffect, useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootNavigationProp, ScreenRouteProp } from '../types/navigation';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../theme';

interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
  genres: Array<{ id: number; name: string }>;
  runtime: number;
  backdrop_path: string;
  tagline?: string;
}

export default function MovieDetailsScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const route = useRoute<ScreenRouteProp<'MovieDetails'>>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const { language } = useLanguage();
  const { t } = useTranslation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Image
          source={require('../assets/logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      ),
      headerShown: true,
    });
  }, [navigation]);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      console.log('MovieDetailsScreen - Starting fetch:', {
        movieId: route.params.movieId,
        language,
        currentLanguage: language === 'pt' ? 'pt-BR' : 'en-US'
      });

      setLoading(true);
      try {
        const apiUrl = `https://api.themoviedb.org/3/movie/${route.params.movieId}?api_key=${process.env.EXPO_PUBLIC_TMDB_API_KEY}&language=${language === 'pt' ? 'pt-BR' : 'en-US'}`;
        console.log('MovieDetailsScreen - API URL:', apiUrl);

        const response = await axios.get<Movie>(apiUrl);
        console.log('MovieDetailsScreen - Movie data received:', {
          title: response.data.title,
          hasOverview: !!response.data.overview,
          hasTagline: !!response.data.tagline,
          genresCount: response.data.genres.length
        });

        setMovie(response.data);
        
        // Check if movie is in favorites
        try {
          const token = await AsyncStorage.getItem('userToken');
          console.log('MovieDetailsScreen - Checking favorites:', {
            hasToken: !!token
          });

          if (!token) {
            setIsFavorite(false);
            return;
          }

          const favResponse = await axios.get(
            `http://localhost:3000/api/movies/favorites/${route.params.movieId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          console.log('MovieDetailsScreen - Favorites status:', favResponse.data.data.isFavorite);
          setIsFavorite(favResponse.data.data.isFavorite);
        } catch (error) {
          console.error('MovieDetailsScreen - Error checking favorites:', error);
          setIsFavorite(false);
        }
      } catch (error) {
        console.error('MovieDetailsScreen - Error fetching movie details:', error);
        Alert.alert(t('errors.loadDetailsFailed'), t('errors.tryAgain'));
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [route.params.movieId, language, t]);

  const handleToggleFavorite = async () => {
    console.log('Starting handleToggleFavorite...');
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('Token retrieved:', token ? 'Token exists' : 'No token found');
      
      if (!token) {
        console.log('No token found, redirecting to login');
        Toast.show({
          type: 'error',
          text1: t('auth.authRequired'),
          text2: t('auth.loginToFavorite'),
        });
        navigation.navigate('Login');
        return;
      }

      if (isFavorite) {
        console.log('Removing from favorites...');
        const response = await axios.delete(
          `${process.env.API_URL}/movies/favorites/${route.params.movieId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        console.log('Remove favorite response:', response.status, response.data);
        setIsFavorite(false);
        Toast.show({
          type: 'success',
          text1: t('movies.success'),
          text2: t('movies.removedFromFavorites'),
        });
      } else {
        console.log('Adding to favorites...');
        if (!movie) {
          console.log('No movie data available');
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Movie data not available',
          });
          return;
        }

        const response = await axios.post(
          `${process.env.API_URL}/movies/favorites`,
          {
            movieId: route.params.movieId,
            title: movie.title,
            posterPath: movie.poster_path,
            overview: movie.overview,
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        console.log('Add favorite response:', response.status, response.data);
        setIsFavorite(true);
        Toast.show({
          type: 'success',
          text1: t('movies.success'),
          text2: t('movies.addedToFavorites'),
        });
      }
    } catch (error) {
      console.error('Error in handleToggleFavorite:', error);
      if (axios.isAxiosError(error)) {
        console.log('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        
        if (error.response?.status === 401) {
          console.log('401 Unauthorized error, clearing token and redirecting to login');
          await AsyncStorage.removeItem('userToken');
          Toast.show({
            type: 'error',
            text1: t('auth.sessionExpired'),
            text2: t('auth.pleaseLoginAgain'),
          });
          navigation.navigate('Login');
        } else {
          console.log('Other API error');
          Toast.show({
            type: 'error',
            text1: t('errors.unexpectedError'),
            text2: t('errors.tryAgain'),
          });
        }
      } else {
        console.log('Non-Axios error:', error);
        Toast.show({
          type: 'error',
          text1: t('errors.unexpectedError'),
          text2: t('errors.tryAgain'),
        });
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.errorContainer}>
        <Text>Failed to load movie details</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <Image
              source={{ uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}` }}
              style={styles.poster}
            />
            <Text style={styles.title}>{movie.title}</Text>
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                {new Date(movie.release_date).getFullYear()}
              </Text>
              <Text style={styles.rating}>⭐ {movie.vote_average.toFixed(1)}/10</Text>
            </View>
            <Text style={styles.sectionTitle}>{t('movies.overview')}</Text>
            <Text style={styles.overview}>{movie.overview}</Text>
            <Text style={styles.sectionTitle}>{t('movies.genres')}</Text>
            <View style={styles.genreContainer}>
              {movie.genres.map((genre) => (
                <React.Fragment key={genre.id}>
                  <View style={styles.genre}>
                    <Text style={styles.genreText}>{genre.name}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
            {isFavorite ? (
              <TouchableOpacity
                style={styles.removeFavoriteButton}
                onPress={handleToggleFavorite}
              >
                <Text style={styles.removeFavoriteButtonText}>
                  {t('movies.removeFromFavorites')}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={handleToggleFavorite}
              >
                <Text style={styles.favoriteButtonText}>
                  {t('movies.addToFavorites')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.medium,
  },
  poster: {
    width: '100%',
    height: 400,
    borderRadius: BORDER_RADIUS.medium,
    marginBottom: SPACING.large,
  },
  title: {
    fontSize: FONT_SIZE.extraLarge,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.medium,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.medium,
  },
  infoText: {
    fontSize: FONT_SIZE.medium,
    color: COLORS.text,
  },
  rating: {
    fontSize: FONT_SIZE.medium,
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: FONT_SIZE.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.medium,
  },
  overview: {
    fontSize: FONT_SIZE.medium,
    color: COLORS.text,
    lineHeight: FONT_SIZE.medium * 1.5,
    marginBottom: SPACING.large,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.large,
  },
  genre: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.small,
    paddingVertical: SPACING.xsmall,
    borderRadius: BORDER_RADIUS.small,
    marginRight: SPACING.small,
    marginBottom: SPACING.small,
  },
  genreText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.small,
  },
  favoriteButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.medium,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    marginTop: SPACING.medium,
    ...SHADOWS.small,
  },
  favoriteButtonText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.medium,
    fontWeight: 'bold',
  },
  removeFavoriteButton: {
    backgroundColor: COLORS.error,
    padding: SPACING.medium,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    marginTop: SPACING.medium,
    ...SHADOWS.small,
  },
  removeFavoriteButtonText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.medium,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogo: {
    width: 120,
    height: 40,
  },
}); 