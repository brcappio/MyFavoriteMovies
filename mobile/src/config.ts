import { API_URL as ENV_API_URL, TMDB_IMAGE_BASE_URL } from '@env';

export const API_URL = ENV_API_URL || 'http://localhost:3000/api';
export const IMAGE_BASE_URL = TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/w500'; 