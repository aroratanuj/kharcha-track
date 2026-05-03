import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/Toast';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const toast = useToast();
  const { colors, fontFamily } = useTheme();
  const navigation = useNavigation<any>();

  const passwordRef = useRef<TextInput>(null);

  async function handleLogin() {
    if (!email.trim()) { toast.error('Email is required'); return; }
    if (!EMAIL_REGEX.test(email)) { toast.error('Enter a valid email address'); return; }
    if (!password) { toast.error('Password is required'); return; }
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success('Logged in successfully');
    } catch (error: any) {
      if (error.message?.includes('Network')) {
        toast.error('Cannot connect to server. Is the backend running?');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally { setLoading(false); }
  }

  function handleEmailSubmit() { passwordRef.current?.focus(); }
  function handlePasswordSubmit() { handleLogin(); }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.outer, { backgroundColor: colors.bg }]}>
        <View style={s.header}>
          <View style={[s.logoRing, { borderColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={s.logoIcon}>₹</Text>
          </View>
          <Text style={[s.appName, { fontFamily }]}>Kharcha</Text>
          <Text style={[s.tagline, { fontFamily }]}>Track every rupee. Own your money.</Text>
        </View>

        <View style={[s.card, { backgroundColor: colors.surface }]}>
          <Text style={[s.cardTitle, { color: colors.text, fontFamily }]}>Welcome back</Text>
          <Text style={[s.cardSub, { color: colors.textMuted, fontFamily }]}>Sign in to continue</Text>

          <Text style={[s.label, { color: colors.textMuted, fontFamily }]}>Email</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text, fontFamily }]}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={handleEmailSubmit}
            returnKeyType="next"
            autoCapitalize="none"
            keyboardType="email-address"
            maxLength={254}
            autoComplete="email"
            textContentType="emailAddress"
          />

          <Text style={[s.label, { color: colors.textMuted, fontFamily }]}>Password</Text>
          <View style={[s.pwWrap, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
            <TextInput
              ref={passwordRef}
              style={[s.pwInput, { color: colors.text, fontFamily }]}
              placeholder="Enter password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handlePasswordSubmit}
              returnKeyType="done"
              secureTextEntry={!showPassword}
              maxLength={128}
            />
            <TouchableOpacity onPress={() => setShowPassword(p => !p)} hitSlop={12} style={s.pwEye}>
              <Text style={s.pwEyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled, { backgroundColor: colors.primary }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={[s.btnText, { fontFamily }]}>{loading ? 'Signing in...' : 'Sign In'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.linkWrap} onPress={() => navigation.navigate('Register')}>
            <Text style={[s.link, { fontFamily }]}>
              <Text style={{ color: colors.textMuted }}>Don't have an account? </Text>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  outer: { flex: 1 },
  header: { paddingTop: 80, paddingBottom: 40, alignItems: 'center', backgroundColor: '#2A1F5E' },
  logoRing: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoIcon: { fontSize: 32, color: '#fff', fontWeight: '800' },
  appName: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  card: { flex: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 32 },
  cardTitle: { fontSize: 24, fontWeight: '700' },
  cardSub: { fontSize: 14, marginTop: 4, marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, marginBottom: 18, fontSize: 15 },
  pwWrap: { height: 50, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 24 },
  pwInput: { flex: 1, fontSize: 15, height: '100%' },
  pwEye: { padding: 8 },
  pwEyeIcon: { fontSize: 18 },
  btn: { borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  linkWrap: { marginTop: 24, alignItems: 'center', marginBottom: 40 },
  link: { fontSize: 14 },
});
