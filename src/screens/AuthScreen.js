import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { useAuthViewModel } from '../viewmodels/AuthViewModel';

export default function AuthScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useContext(ThemeContext);
  const {
    loading,
    authLoading,
    error,
    isRegisterMode,
    initializeAuth,
    handleRegister,
    handleLogin,
    toggleAuthMode,
    handleResetPassword,
  } = useAuthViewModel();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert(t('error'), t('fillRequired'));
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert(t('error'), t('invalidEmail') || 'Invalid email format');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert(t('error'), t('weakPassword') || 'Password must be at least 6 characters');
      return;
    }

    if (isRegisterMode && password !== confirmPassword) {
      Alert.alert(t('error'), t('passwordMismatch') || 'Passwords do not match');
      return;
    }

    const result = isRegisterMode
      ? await handleRegister(email, password, displayName)
      : await handleLogin(email, password);

    if (!result.success) {
      Alert.alert(t('error'), result.error || t('authFailed'));
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert(t('error'), t('enterEmail') || 'Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert(t('error'), t('invalidEmail') || 'Invalid email format');
      return;
    }

    const result = await handleResetPassword(email);
    
    if (result.success) {
      Alert.alert(
        t('success'),
        t('resetEmailSent') || 'Password reset email has been sent to your email address'
      );
    } else {
      Alert.alert(t('error'), result.error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Ionicons name="musical-notes" size={80} color={theme.colors.accent} />
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('musicCatalog')}
          </Text>
        </View>

        <View style={[styles.formContainer, { backgroundColor: theme.colors.surface }]}>
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorBg }]}>
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
            </View>
          )}

          {isRegisterMode && (
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.background, 
                color: theme.colors.text 
              }]}
              placeholder={t('displayName') || 'Display Name'}
              placeholderTextColor={theme.colors.textSecondary}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          )}

          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.colors.background, 
              color: theme.colors.text 
            }]}
            placeholder={t('email') || 'Email'}
            placeholderTextColor={theme.colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.passwordInput, { 
                backgroundColor: theme.colors.background, 
                color: theme.colors.text 
              }]}
              placeholder={t('password') || 'Password'}
              placeholderTextColor={theme.colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={24}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {isRegisterMode && (
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, { 
                  backgroundColor: theme.colors.background, 
                  color: theme.colors.text 
                }]}
                placeholder={t('confirmPassword') || 'Confirm Password'}
                placeholderTextColor={theme.colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.accent }]}
            onPress={handleSubmit}
            disabled={authLoading}
          >
            {authLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={[styles.buttonText, { color: 'white' }]}>
                {isRegisterMode ? t('register') : t('login')}
              </Text>
            )}
          </TouchableOpacity>

          {!isRegisterMode && (
          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword}
          >
            <Text style={[styles.forgotPasswordText, { color: theme.colors.accent }]}>
              {t('forgotPassword') || 'Forgot Password?'}
            </Text>
          </TouchableOpacity>
          )}

          {!isRegisterMode && (
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>
              {t('or')}
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          </View>
          )}

          <TouchableOpacity
            style={[styles.switchButton, { backgroundColor: theme.colors.background }]}
            onPress={toggleAuthMode}
          >
            <Text style={[styles.switchButtonText, { color: theme.colors.accent }]}>
              {isRegisterMode
                ? t('alreadyHaveAccount') || 'Already have an account? Login'
                : t('dontHaveAccount') || 'Don\'t have an account? Register'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
  },
  formContainer: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  errorContainer: {
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
  },
  button: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  switchButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  switchButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
