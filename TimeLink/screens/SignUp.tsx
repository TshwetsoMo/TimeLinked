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

// Import our new services, hooks, and types
import { RootStackParamList } from '../navigation/AppNavigation';
import { useTheme } from '../theme/ThemeContext'; // Ensure this points to the correct context file
import { spacing } from '../theme/spacing';
// ✅ FIX: Corrected the import path to point to the finalized auth.ts service.
import { registerUser } from '../services/authService'; 

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props) {
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    // Basic client-side validation
    if (!name.trim() || !email.trim() || !password) {
      return Alert.alert('Missing Information', 'Please fill out all fields to create your account.');
    }
    
    setLoading(true);
    try {
      // ONE clean call to our auth service.
      await registerUser(email.trim(), password, name.trim());
      
      // Navigation is now handled by the AuthContext listener.

    } catch (error: any) {
      // The auth service throws an error, and we catch it here to show the UI.
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already registered. Please log in.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'That email address is not valid.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Your password must be at least 6 characters long.';
      }
      Alert.alert('Sign-Up Failed', errorMessage);
    } finally {
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

        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
          placeholder="Your Name"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          editable={!loading}
        />

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

        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
          placeholder="Password (min. 6 characters)"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

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
    // ✅ FIX: Removed hardcoded color to allow for theming.
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

