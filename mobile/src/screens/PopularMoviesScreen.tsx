import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MovieStackParamList } from '../../App';
import axios from 'axios';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from 'react-i18next';
import debounce from 'lodash/debounce';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../theme';

type Genre = {
  id: number;
  name: string;
};

type TMDBMovie = {
  id: number;
  title: string;
  poster_path: string;
  overview: string;
  vote_average: number;
  release_date: string;
  genre_ids: number[];
};

type TMDBGenreResponse = {
  genres: Genre[];
};

type TMDBMoviesResponse = {
  results: TMDBMovie[];
};

type Movie = {
  id: number;
  title: string;
  poster_path: string;
  overview: string;
  vote_average: number;
  release_date: string;
  genres: Genre[];
};

type SearchResult = Movie;

type NavigationProp = NativeStackNavigationProp<MovieStackParamList>;

const PopularMoviesScreen = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const { language } = useLanguage();
  const { t } = useTranslation();

  const fetchMovies = useCallback(async (pageNumber: number) => {
    console.log('PopularMoviesScreen - Fetching movies:', {
      language,
      pageNumber,
      currentLanguage: language === 'pt' ? 'pt-BR' : 'en-US'
    });

    try {
      // First, fetch the list of genres
      const genresResponse = await axios.get<TMDBGenreResponse>(
        `https://api.themoviedb.org/3/genre/movie/list?api_key=${process.env.EXPO_PUBLIC_TMDB_API_KEY}&language=${language === 'pt' ? 'pt-BR' : 'en-US'}`
      );
      const genresMap = new Map(genresResponse.data.genres.map(genre => [genre.id, genre]));

      // Then fetch the popular movies
      const apiUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.EXPO_PUBLIC_TMDB_API_KEY}&language=${language === 'pt' ? 'pt-BR' : 'en-US'}&page=${pageNumber}`;
      console.log('PopularMoviesScreen - API URL:', apiUrl);

      const response = await axios.get<TMDBMoviesResponse>(apiUrl);
      console.log('PopularMoviesScreen - API Response:', {
        totalResults: response.data.results.length,
        firstMovieTitle: response.data.results[0]?.title
      });

      // Add genre information to each movie
      const newMovies = response.data.results.map(movie => ({
        ...movie,
        genres: movie.genre_ids.map(id => ({
          id,
          name: genresMap.get(id)?.name || 'Unknown'
        }))
      }));

      if (pageNumber === 1) {
        console.log('PopularMoviesScreen - Resetting movies list');
        setMovies(newMovies);
      } else {
        console.log('PopularMoviesScreen - Appending to movies list');
        setMovies(prev => [...prev, ...newMovies]);
      }
      setHasMore(newMovies.length > 0);
    } catch (error) {
      console.error('PopularMoviesScreen - Error fetching movies:', error);
      Alert.alert(t('errors.unexpectedError'), t('errors.tryAgain'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [language, t]);

  // Initial load and language change
  useEffect(() => {
    console.log('PopularMoviesScreen - Language changed:', language);
    setLoading(true);
    setPage(1);
    fetchMovies(1);
  }, [language, fetchMovies]);

  // Handle pagination
  useEffect(() => {
    if (page > 1) {
      console.log('PopularMoviesScreen - Loading more pages:', page);
      setLoadingMore(true);
      fetchMovies(page);
    }
  }, [page, fetchMovies]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  // Debounced search function
  const searchMovies = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setShowDropdown(false);
        setSearching(false);
        return;
      }

      try {
        // First, fetch the list of genres
        const genresResponse = await axios.get<TMDBGenreResponse>(
          `https://api.themoviedb.org/3/genre/movie/list?api_key=${process.env.EXPO_PUBLIC_TMDB_API_KEY}&language=${language === 'pt' ? 'pt-BR' : 'en-US'}`
        );
        const genresMap = new Map(genresResponse.data.genres.map(genre => [genre.id, genre]));

        // Then search for movies
        const response = await axios.get<TMDBMoviesResponse>(
          `https://api.themoviedb.org/3/search/movie?api_key=${process.env.EXPO_PUBLIC_TMDB_API_KEY}&language=${language === 'pt' ? 'pt-BR' : 'en-US'}&query=${encodeURIComponent(query)}&page=1`
        );

        // Add genre information to each movie
        const resultsWithGenres = response.data.results.map(movie => ({
          ...movie,
          genres: movie.genre_ids.map(id => ({
            id,
            name: genresMap.get(id)?.name || 'Unknown'
          }))
        }));

        setSearchResults(resultsWithGenres.slice(0, 5));
        setShowDropdown(true);
      } catch (error) {
        console.error('Error searching movies:', error);
      } finally {
        setSearching(false);
      }
    }, 500),
    [language]
  );

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setSearching(true);
    searchMovies(text);
  };

  const handleSelectMovie = (movieId: number) => {
    setSearchQuery('');
    setShowDropdown(false);
    navigation.navigate('MovieDetails', { movieId });
  };

  const renderMovie = ({ item }: { item: Movie }) => (
    <TouchableOpacity
      style={styles.movieItem}
      onPress={() => navigation.navigate('MovieDetails', { movieId: item.id })}
    >
      <Image
        source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
        style={styles.poster}
      />
      <View style={styles.movieInfo}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.releaseDate}>
          {new Date(item.release_date).toLocaleDateString(
            language === 'pt' ? 'pt-BR' : 'en-US',
            {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }
          )}
        </Text>
        <View style={styles.genreContainer}>
          {item.genres?.map((genre) => (
            <View key={genre.id} style={styles.genre}>
              <Text style={styles.genreText}>{genre.name}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.overview} numberOfLines={3}>
          {item.overview}
        </Text>
        <Text style={styles.rating}>⭐ {item.vote_average.toFixed(1)}/10</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handleSelectMovie(item.id)}
    >
      <Image
        source={{ uri: `https://image.tmdb.org/t/p/w92${item.poster_path}` }}
        style={styles.searchResultPoster}
      />
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultTitle}>{item.title}</Text>
        <Text style={styles.searchResultOverview} numberOfLines={2}>
          {item.overview}
        </Text>
        <Text style={styles.releaseDate}>
          {new Date(item.release_date).toLocaleDateString(
            language === 'pt' ? 'pt-BR' : 'en-US',
            {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }
          )}
        </Text>
        <View style={styles.genreContainer}>
          {item.genres?.map((genre) => (
            <View key={genre.id} style={styles.genre}>
              <Text style={styles.genreText}>{genre.name}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.rating}>⭐ {item.vote_average.toFixed(1)}/10</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#0000ff" />
      </View>
    );
  };

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('movies.searchPlaceholder')}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searching && (
          <ActivityIndicator style={styles.searchingIndicator} size="small" />
        )}
      </View>
      
      {showDropdown && searchResults.length > 0 && (
        <View style={styles.dropdownContainer}>
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id.toString()}
            style={styles.searchResults}
          />
        </View>
      )}

      {showDropdown && searchResults.length === 0 && !searching && (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>{t('movies.noResults')}</Text>
        </View>
      )}

      <FlatList
        data={movies}
        renderItem={renderMovie}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
};

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
    backgroundColor: COLORS.background,
  },
  movieItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.medium,
    marginBottom: SPACING.medium,
    padding: SPACING.medium,
    ...SHADOWS.small,
  },
  poster: {
    width: 100,
    height: 150,
    borderRadius: BORDER_RADIUS.medium,
  },
  movieInfo: {
    flex: 1,
    marginLeft: SPACING.medium,
  },
  title: {
    fontSize: FONT_SIZE.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.small,
  },
  releaseDate: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text,
    marginBottom: SPACING.small,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.small,
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
  overview: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text,
    marginBottom: SPACING.small,
  },
  rating: {
    fontSize: FONT_SIZE.medium,
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  footer: {
    paddingVertical: SPACING.large,
  },
  searchContainer: {
    padding: SPACING.medium,
    backgroundColor: COLORS.searchBackground,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.large,
    paddingHorizontal: SPACING.medium,
    borderWidth: 1,
    borderColor: COLORS.searchBorder,
  },
  searchingIndicator: {
    position: 'absolute',
    right: SPACING.large,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    zIndex: 1000,
    maxHeight: 300,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchResults: {
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: 'row',
    padding: SPACING.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  searchResultPoster: {
    width: 50,
    height: 75,
    borderRadius: BORDER_RADIUS.small,
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: SPACING.medium,
  },
  searchResultTitle: {
    fontSize: FONT_SIZE.medium,
    fontWeight: 'bold',
    marginBottom: SPACING.small,
    color: COLORS.textDark,
  },
  searchResultOverview: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text,
  },
  noResultsContainer: {
    padding: SPACING.large,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  noResultsText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.medium,
  },
  headerLogo: {
    width: 120,
    height: 40,
  },
});

export default PopularMoviesScreen; 