import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Platform } from 'react-native';
import { shouldLog } from '../hooks/useLogLevel';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextData {
  showToast: (message: string, type: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimeouts = useRef<Map<number, NodeJS.Timeout>>(new Map());

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timeout = toastTimeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      toastTimeouts.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType) => {
      const logLevel = TOAST_LOG_MAP[type] || 'INFO';
      shouldLog(logLevel);

      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, type }]);

      const timeout = setTimeout(() => dismissToast(id), 3500);
      toastTimeouts.current.set(id, timeout);
    },
    [dismissToast],
  );

  const success = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const error = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const info = useCallback((message: string) => showToast(message, 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((toast, index) => (
          <ToastItem key={toast.id} toast={toast} index={index} onDismiss={() => dismissToast(toast.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, index, onDismiss }: { toast: Toast; index: number; onDismiss: () => void }) {
  const [slideAnim] = useState(new Animated.Value(-60));

  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const colors = {
    success: { bg: '#10B981', text: '#fff' },
    error: { bg: '#EF4444', text: '#fff' },
    info: { bg: '#3B82F6', text: '#fff' },
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: colors[toast.type].bg,
          transform: [{ translateY: slideAnim }],
          top: 12 + index * 64,
        },
      ]}
    >
      <Text style={styles.icon}>{icons[toast.type]}</Text>
      <Text style={[styles.message, { color: colors[toast.type].text }]} numberOfLines={2}>
        {toast.message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  toast: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  icon: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
    color: '#fff',
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
});

export function useToast() {
  return useContext(ToastContext);
}
