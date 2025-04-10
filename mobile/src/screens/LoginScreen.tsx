/* eslint-disable react-native/no-color-literals */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { RootNavigationProp } from '../types/navigation';
import { COLORS, SPACING, FONT_SIZE } from '../theme';
import axios from 'axios';
import { API_URL } from '@/config';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { t } = useTranslation();
  const navigation = useNavigation<RootNavigationProp>();
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const { token, user } = response.data.data;
      await login(token, user);
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Alert.alert(
          t('errors.loginFailed'),
          error.response?.data?.message || t('errors.invalidCredentials')
        );
      } else {
        Alert.alert(t('errors.unexpectedError'), t('errors.tryAgain'));
      }
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>{t('auth.loginButton')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder={t('auth.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>{t('auth.loginButton')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.registerButton}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.registerText}>
          {t('auth.noAccount')} {t('auth.registerNow')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.large,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: 100,
    marginBottom: SPACING.large,
  },
  title: {
    fontSize: FONT_SIZE.extraLarge,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.large,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    padding: SPACING.medium,
    borderRadius: 8,
    marginBottom: SPACING.medium,
    fontSize: FONT_SIZE.medium,
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SPACING.medium,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.medium,
  },
  buttonText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.medium,
    fontWeight: 'bold',
  },
  registerButton: {
    marginTop: SPACING.medium,
    alignItems: 'center',
  },
  registerText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.medium,
  },
});

export default LoginScreen; 