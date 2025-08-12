// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Import services, hooks, and types
import { RootStackParamList } from '../navigation/AppNavigation';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { loginUser } from '../services/authService'; // Centralized authentication function

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  // Use the theme hook to get current colors for styling.
  const { colors } = useTheme();

  // Local state to manage the form inputs.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Loading state to disable the form during the async login operation.
  const [loading, setLoading] = useState(false);

  // Main function to handle the login process.
  const handleLogin = async () => {
    // 1. Basic client-side validation to ensure inputs are not empty.
    if (!email.trim() || !password) {
      return Alert.alert('Missing Information', 'Please enter both your email and password.');
    }

    setLoading(true);
    try {
      // 2. A single, clean call to the centralized `loginUser` service.
      // This abstracts away the direct Firebase call from the component.
      await loginUser(email.trim(), password);
      // 3. On success, we do nothing. The global AuthProvider will detect
      // the new user state and handle the navigation to the Dashboard automatically.
    } catch (error: any) {
      // 4. If the service throws an error, catch it and show a user-friendly message.
      let errorMessage = 'An unexpected error occurred.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please try again.';
      }
      Alert.alert('Login Failed', errorMessage);
    } finally {
      // 5. Always set loading to false to re-enable the form.
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Text style={[styles.header, { color: colors.text }]}>Welcome Back</Text>
        <Text style={[styles.subHeader, { color: colors.textMuted }]}>
          Sign in to continue your journey.
        </Text>

        {/* Controlled input for the user's email. */}
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
          placeholder="Email Address"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />

        {/* Controlled input for the user's password. */}
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        {/* The main submission button. Shows a loading spinner when active. */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.card} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.card }]}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* A link to navigate to the SignUp screen for new users. */}
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')} disabled={loading}>
          <Text style={[styles.link, { color: colors.textMuted }]}>
            Don't have an account?{' '}
            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// All styles are themed and use consistent spacing.
const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  header: { fontSize: 32, fontWeight: 'bold', textAlign: 'center' },
  subHeader: { fontSize: 16, textAlign: 'center', marginBottom: spacing.lg, marginTop: spacing.sm },
  input: { height: 50, borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, marginBottom: spacing.md, fontSize: 16 },
  button: { height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: spacing.sm },
  buttonText: { fontSize: 18, fontWeight: 'bold' },
  link: { textAlign: 'center', marginTop: spacing.lg, fontSize: 14 },
});

