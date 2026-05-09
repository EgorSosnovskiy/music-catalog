import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  initializeAuthService, 
  registerUser, 
  loginUser, 
  logoutUser, 
  resetPassword, 
  onAuthStateChangedListener,
  getCurrentUser 
} from '../services/AuthService';
import { getAlbums, getTracks } from '../database';

/**
 * ViewModel для управления авторизацией
 * Реализует паттерн MVVM - инкапсулирует бизнес-логику аутентификации
 */
export const useAuthViewModel = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  /**
   * Переводит код ошибки Firebase в локализованное сообщение
   */
  const getLocalizedAuthErrorMessage = useCallback((errorCode) => {
    const errorMap = {
      // Регистрация
      'auth/email-already-in-use': t('emailAlreadyInUse', 'Email already registered'),
      'auth/invalid-email': t('invalidEmail', 'Invalid email format'),
      'auth/weak-password': t('weakPassword', 'Password must be at least 6 characters'),
      
      // Вход
      'auth/user-not-found': t('userNotFound', 'User not found'),
      'auth/wrong-password': t('wrongPassword', 'Wrong password'),
      'auth/invalid-credential': t('invalidCredential', 'Invalid email or password'),
      
      // Сеть
      'auth/network-request-failed': t('networkError', 'Network error. Check your internet connection'),
      'auth/too-many-requests': t('tooManyRequests', 'Too many attempts. Try again later'),
      
      // Аккаунт
      'auth/user-disabled': t('userDisabled', 'Account disabled'),
      'auth/operation-not-allowed': t('operationNotAllowed', 'Operation not allowed'),
      'auth/account-exists-with-different-credential': t('accountExistsWithDifferentCredential', 'Account already exists with different credentials'),
      
      // Конфигурация
      'auth/configuration-not-found': t('configurationNotFound', 'Email/Password provider is not enabled in Firebase Console'),
      'auth/invalid-api-key': t('invalidApiKey', 'Invalid Firebase API key'),
      'auth/app-not-authorized': t('appNotAuthorized', 'App not authorized'),
      
      // Другое
      'auth/missing-email': t('missingEmail', 'Email is required'),
      'auth/missing-password': t('missingPassword', 'Password is required'),
      'auth/requires-recent-login': t('requiresRecentLogin', 'Recent login required'),
      
      // Системные
      'auth/not-initialized': t('authNotInitialized', 'Authentication not initialized'),
    };
    return errorMap[errorCode] || t('authError', 'Authentication error');
  }, [t]);

  /**
   * Инициализация аутентификации
   */
  const initializeAuth = useCallback(async () => {
    try {
      await initializeAuthService();
      
      // Подписываемся на изменения состояния аутентификации
      const unsubscribe = onAuthStateChangedListener((currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });

      return unsubscribe;
    } catch (err) {
      setError(err.message || 'Ошибка инициализации аутентификации');
      setLoading(false);
      return () => {};
    }
  }, []);

   /**
    * Регистрация пользователя
    */
   const handleRegister = useCallback(async (email, password, displayName) => {
     setAuthLoading(true);
     setError(null);
     
     try {
       const result = await registerUser(email, password, displayName);
       
       if (!result.success) {
         const errorMessage = getLocalizedAuthErrorMessage(result.error) || t('authFailed');
         throw new Error(errorMessage);
       }
       
       await loadUserData();
       return { success: true };
     } catch (err) {
       setError(err.message || t('authFailed'));
       return { success: false, error: err.message };
     } finally {
       setAuthLoading(false);
     }
   }, [t, getLocalizedAuthErrorMessage]);

   /**
    * Вход пользователя
    */
   const handleLogin = useCallback(async (email, password) => {
     setAuthLoading(true);
     setError(null);
     
     try {
       const result = await loginUser(email, password);
       
       if (!result.success) {
         const errorMessage = getLocalizedAuthErrorMessage(result.error) || t('authFailed');
         throw new Error(errorMessage);
       }
       
       await loadUserData();
       return { success: true };
     } catch (err) {
       setError(err.message || t('authFailed'));
       return { success: false, error: err.message };
     } finally {
       setAuthLoading(false);
     }
   }, [t, getLocalizedAuthErrorMessage]);

   /**
    * Выход пользователя
    */
   const handleLogout = useCallback(async () => {
     setAuthLoading(true);
     setError(null);
     
     try {
       const result = await logoutUser();
       
       if (!result.success) {
         const errorMessage = getLocalizedAuthErrorMessage(result.error) || t('authFailed');
         throw new Error(errorMessage);
       }
       
       setUser(null);
       return { success: true };
     } catch (err) {
       setError(err.message || t('logoutError'));
       return { success: false, error: err.message };
     } finally {
       setAuthLoading(false);
     }
   }, [t, getLocalizedAuthErrorMessage]);

   /**
    * Сброс пароля
    */
   const handleResetPassword = useCallback(async (email) => {
     setAuthLoading(true);
     setError(null);
     
     try {
       const result = await resetPassword(email);
       
       if (!result.success) {
         const errorMessage = getLocalizedAuthErrorMessage(result.error) || t('authFailed');
         throw new Error(errorMessage);
       }
       
       return { success: true };
     } catch (err) {
       setError(err.message || t('passwordResetError'));
       return { success: false, error: err.message };
     } finally {
       setAuthLoading(false);
     }
   }, [t, getLocalizedAuthErrorMessage]);

  /**
   * Загрузка пользовательских данных
   */
  const loadUserData = useCallback(async () => {
    try {
      // Загружаем альбомы и треки для обновления локальной БД
      await Promise.all([
        getAlbums(),
        getTracks(),
      ]);
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  }, []);

  /**
   * Переключение между режимами входа/регистрации
   */
  const toggleAuthMode = useCallback(() => {
    setIsRegisterMode(!isRegisterMode);
    setError(null);
  }, [isRegisterMode]);

  return {
    // Состояние
    user,
    loading,
    authLoading,
    error,
    isRegisterMode,
    
    // Методы
    initializeAuth,
    handleRegister,
    handleLogin,
    handleLogout,
    handleResetPassword,
    toggleAuthMode,
    loadUserData,
  };
};

export default useAuthViewModel;