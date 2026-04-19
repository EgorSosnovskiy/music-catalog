import NetInfo from '@react-native-community/netinfo';
import { createContext, useContext, useState, useEffect } from 'react';

/**
 * Сервис для мониторинга интернет-соединения
 */
class NetworkServiceClass {
  constructor() {
    this.isConnected = true;
    this.listeners = [];
  }

  /**
   * Инициализация мониторинга сети
   */
  async init() {
    // Получить начальное состояние
    const state = await NetInfo.fetch();
    this.isConnected = state.isConnected ?? false;
    this.notifyListeners();

    // Подписаться на изменения
    NetInfo.addEventListener(state => {
      const wasConnected = this.isConnected;
      this.isConnected = state.isConnected ?? false;
      
      // Уведомить только при изменении состояния
      if (wasConnected !== this.isConnected) {
        this.notifyListeners();
      }
    });
  }

  /**
   * Получить текущее состояние соединения
   */
  getConnectionState() {
    return this.isConnected;
  }

  /**
   * Подписаться на изменения состояния сети (alias для совместимости)
   */
  addListener(event, callback) {
    if (event === 'connectionChange') {
      return this.subscribe(callback);
    }
    return () => {};
  }

  /**
   * Подписаться на изменения состояния сети
   */
  subscribe(callback) {
    this.listeners.push(callback);
    // Вернуть функцию отписки
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Уведомить всех подписчиков об изменении
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      callback(this.isConnected);
    });
  }
}

// Экземпляр сервиса
export const networkService = new NetworkServiceClass();

// React Hook для использования в компонентах
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(networkService.getConnectionState());

  useEffect(() => {
    // Инициализировать сервис при первом использовании
    networkService.init();

    // Подписаться на изменения
    const unsubscribe = networkService.subscribe((connected) => {
      setIsConnected(connected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return isConnected;
};

// React Context для доступа к сервису
const NetworkContext = createContext({
  isConnected: true,
  subscribe: () => {},
});

export const NetworkProvider = ({ children }) => {
  const isConnected = useNetworkStatus();

  return (
    <NetworkContext.Provider value={{ isConnected }}>
      {children}
    </NetworkContext.Provider>
  );
};

export default networkService;
