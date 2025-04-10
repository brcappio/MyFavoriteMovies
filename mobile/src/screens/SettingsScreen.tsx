import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZE } from '../theme';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '@/config';

const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { setLanguage } = useLanguage();
  const { logout, user, updateUser } = useAuth();
  const navigation = useNavigation();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('errors.permissionDenied'), t('errors.cameraRollPermission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      base64: false,
      exif: false,
    });

    if (!result.canceled && result.assets[0].uri) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const changeLanguage = async (lang: string) => {
    try {
      console.log('SettingsScreen - Changing language to:', lang);
      await i18n.changeLanguage(lang);
      await AsyncStorage.setItem('language', lang);
      setLanguage(lang);
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert('Error', 'Failed to change language');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const uploadImage = async (uri: string) => {
    try {
      console.log('SettingsScreen - Starting image upload');
      console.log('SettingsScreen - Image URI:', uri);
      
      const formData = new FormData();
      
      // Check if the URI is a base64 data URI
      if (uri.startsWith('data:')) {
        // Convert base64 to blob
        const base64Data = uri.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        
        for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
          const slice = byteCharacters.slice(offset, offset + 1024);
          const byteNumbers = new Array(slice.length);
          
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          
          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }
        
        const blob = new Blob(byteArrays, { type: 'image/jpeg' });
        formData.append('photo', blob, 'profile-photo.jpg');
      } else {
        // Handle regular file URI
        const file = {
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
          type: 'image/jpeg',
          name: 'profile-photo.jpg',
        };
        formData.append('photo', file as unknown as Blob);
      }

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('SettingsScreen - Token found, uploading to:', `${API_URL}/auth/update-photo`);
      
      const { data } = await axios.post(`${API_URL}/auth/update-photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
        transformRequest: (data) => data, // Prevent axios from transforming the FormData
      });

      console.log('SettingsScreen - Upload response:', data);

      if (data.data?.user?.photoUrl) {
        console.log('SettingsScreen - Updating user photo URL:', data.data.user.photoUrl);
        await updateUser({ photoUrl: data.data.user.photoUrl });
      }
    } catch (error) {
      console.error('SettingsScreen - Error uploading image:', error);
      if (axios.isAxiosError(error)) {
        console.error('SettingsScreen - Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          config: error.config,
        });
      }
      Alert.alert(
        t('errors.uploadFailed'),
        t('errors.tryAgain')
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        <TouchableOpacity onPress={pickImage}>
          <Image
            source={
              user?.photoUrl 
                ? { 
                    uri: user.photoUrl,
                    cache: 'reload'
                  } 
                : require('../assets/default-avatar.png')
            }
            style={styles.profilePhoto}
            onError={(e) => {
              console.error('Error loading profile photo:', e.nativeEvent.error);
            }}
          />
          <Text style={styles.editPhotoText}>{t('settings.editPhoto')}</Text>
        </TouchableOpacity>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
      <View style={styles.languageButtons}>
        <TouchableOpacity
          style={[
            styles.button,
            i18n.language === 'en' && styles.activeButton,
          ]}
          onPress={() => changeLanguage('en')}
        >
          <Text
            style={[
              styles.buttonText,
              i18n.language === 'en' && styles.activeButtonText,
            ]}
          >
            English
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            i18n.language === 'pt' && styles.activeButton,
          ]}
          onPress={() => changeLanguage('pt')}
        >
          <Text
            style={[
              styles.buttonText,
              i18n.language === 'pt' && styles.activeButtonText,
            ]}
          >
            Português
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>{t('settings.logout')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.large, // Add padding to the container
  },
  profileSection: {
    alignItems: 'center',
    padding: SPACING.large,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: SPACING.medium, // Add margin for spacing
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: SPACING.small,
  },
  editPhotoText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.small,
    textAlign: 'center',
    marginTop: SPACING.small,
  },
  userName: {
    fontSize: FONT_SIZE.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.medium,
  },
  userEmail: {
    fontSize: FONT_SIZE.medium,
    color: COLORS.textLight,
    marginTop: SPACING.small,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.large,
    marginBottom: SPACING.medium,
  },
  languageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Use space-around for even spacing
    marginBottom: SPACING.large,
  },
  button: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
  },
  activeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.medium,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.large,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default SettingsScreen; 