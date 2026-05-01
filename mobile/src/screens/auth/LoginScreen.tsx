import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/Toast';
import { useResponsive } from '../../hooks/useResponsive';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const toast = useToast();
  const { colors } = useTheme();
  const { isWeb, maxContentWidth, contentPadding } = useResponsive();
  const navigation = useNavigation<any>();

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

  function handleEmailSubmit() { passwordRef.current?.focus(); }
  function handlePasswordSubmit() { handleLogin(); }

  return (
    <View style={[s.outer, { backgroundColor: colors.bg }]}>
      <View style={[s.container, isWeb && s.containerWeb, { maxWidth: maxContentWidth, paddingHorizontal: contentPadding, backgroundColor: colors.surface, shadowColor: colors.shadowColor }]}>
        <Text style={[s.title, { color: colors.primary }]}>Kharcha</Text>
        <Text style={[s.subtitle, { color: colors.textSecondary }]}>Expense Tracker</Text>

        <Text style={[s.label, { color: colors.text }]}>Email</Text>
        <TextInput
          style={[s.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={handleEmailSubmit}
          returnKeyType="next"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={[s.label, { color: colors.text }]}>Password</Text>
        <View style={s.passwordWrap}>
          <TextInput
            ref={passwordRef}
            style={[s.passwordInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handlePasswordSubmit}
            returnKeyType="done"
            secureTextEntry={!showPassword}
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity
            style={[s.eyeBtn, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
          >
            <Text style={s.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[s.button, loading && s.buttonDisabled, { backgroundColor: colors.primary }]}
          onPress={handleLogin}
          disabled={loading}
          accessibilityLabel="Login"
        >
          <Text style={[s.buttonText, { color: colors.primaryText }]}>{loading ? 'Logging in...' : 'Login'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.linkWrap} onPress={() => navigation.navigate('Register')}>
          <Text style={[s.link, { color: colors.primary }]}>Don't have an account? <Text style={s.linkBold}>Sign Up</Text></Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { flex: 1, justifyContent: 'center' },
  container: { padding: 24, borderRadius: 16, marginHorizontal: 16, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  containerWeb: { alignSelf: 'center', marginHorizontal: 'auto' },
  title: { fontSize: 36, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: { height: 50, borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, marginBottom: 16, fontSize: 16 },
  passwordWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  passwordInput: { flex: 1, height: 50, borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, fontSize: 16, borderTopRightRadius: 0, borderBottomRightRadius: 0 },
  eyeBtn: { height: 50, width: 48, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderLeftWidth: 0, borderRadius: 10, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  eyeIcon: { fontSize: 18 },
  button: { borderRadius: 10, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  link: { fontSize: 14 },
  linkBold: { fontWeight: '700' },
});
