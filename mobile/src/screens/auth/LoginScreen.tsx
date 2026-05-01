import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { useResponsive } from '../../hooks/useResponsive';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const toast = useToast();
  const { isWeb, maxContentWidth, contentPadding } = useResponsive();

  const passwordRef = useRef<TextInput>(null);

  async function handleLogin() {
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }

    if (!password) {
      toast.error('Password is required');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      toast.success('Logged in successfully');
    } catch (error: any) {
      const msg = error.response?.data?.message;
      if (msg) {
        toast.error(msg);
      } else if (error.message?.includes('Network')) {
        toast.error('Cannot connect to server. Is the backend running?');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleEmailSubmit() {
    passwordRef.current?.focus();
  }

  function handlePasswordSubmit() {
    handleLogin();
  }

  return (
    <View style={styles.outer}>
      <View style={[styles.container, isWeb && styles.containerWeb, { maxWidth: maxContentWidth, paddingHorizontal: contentPadding }]}>
        <Text style={styles.title}>Kharcha</Text>
        <Text style={styles.subtitle}>Expense Tracker</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={handleEmailSubmit}
          returnKeyType="next"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordWrap}>
          <TextInput
            ref={passwordRef}
            style={[styles.passwordInput]}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handlePasswordSubmit}
            returnKeyType="done"
            secureTextEntry={!showPassword}
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  containerWeb: {
    alignSelf: 'center',
    marginHorizontal: 'auto',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    color: '#007AFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    height: 50,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fafafa',
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  eyeBtn: {
    height: 50,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderRadius: 10,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  eyeIcon: {
    fontSize: 18,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
