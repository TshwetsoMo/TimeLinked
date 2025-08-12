// src/screens/SignUpScreen.tsx
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
import { registerUser } from '../services/authService'; // Centralized registration function

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props) {
  // Use the theme hook to get current colors for styling.
  const { colors } = useTheme();

  // Local state for the registration form.
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Loading state to disable the form during the async registration operation.
  const [loading, setLoading] = useState(false);

  // Main function to handle the registration process.
  const handleSignUp = async () => {
    // 1. Basic client-side validation.
    if (!name.trim() || !email.trim() || !password) {
      return Alert.alert('Missing Information', 'Please fill out all fields to create your account.');
    }
    
    setLoading(true);
    try {
      // 2. A single, clean call to the centralized `registerUser` service.
      // This service handles the two-step process of creating the Auth user
      // and their Firestore profile document.
      await registerUser(email.trim(), password, name.trim());
      
      // 3. On success, we do nothing. The global AuthProvider will detect
      // the new user state and handle the navigation to the Dashboard automatically.

    } catch (error: any) {
      // 4. If the service throws an error, catch it and show a user-friendly message.
      let errorMessage = 'An unexpected error occurred.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already registered. Please log in.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'That email address is not valid.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Your password must be at least 6 characters long.';
      }
      Alert.alert('Sign-Up Failed', errorMessage);
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
        <Text style={[styles.header, { color: colors.text }]}>Create Your Account</Text>
        <Text style={[styles.subHeader, { color: colors.textMuted }]}>
          Join the TimeLink community.
        </Text>

        {/* Controlled input for the user's name. */}
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
          placeholder="Your Name"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          editable={!loading}
        />

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
          placeholder="Password (min. 6 characters)"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        {/* The main submission button. Shows a loading spinner when active. */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.card} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.card }]}>Create Account</Text>
          )}
        </TouchableOpacity>

        {/* A link to navigate to the Login screen for users who already have an account. */}
        <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
          <Text style={[styles.link, { color: colors.textMuted }]}>
            Already have an account?{' '}
            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Log In</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// All styles are themed and use consistent spacing.
const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: spacing.md,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    textAlign: 'center',
    marginTop: spacing.lg,
    fontSize: 14,
  },
});

