// src/screens/Welcome.tsx
import React, { useEffect } from 'react';
import {
  Text,
  StyleSheet,
  View,
  Image,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Import hooks and navigation types
import { RootStackParamList } from '../navigation/AppNavigation';
import { useAuth } from '../services/authContext';
import { useTheme } from '../theme/useTheme';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  // Use our custom hooks for auth state and theming
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  // This effect handles automatic redirection
  useEffect(() => {
    // If the auth check is done and we have a user, don't stay here.
    // Replace the current screen with the Dashboard so the user can't navigate back.
    if (!loading && user) {
      navigation.replace('Dashboard');
    }
  }, [user, loading, navigation]);

  // While the initial auth check is happening, show a loading spinner.
  // This prevents the welcome screen from flashing briefly for a logged-in user.
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // If we are not loading and there's no user, show the Welcome content.
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={[styles.title, { color: colors.text }]}>TimeLink</Text>
        <Text style={[styles.tagline, { color: colors.textMuted }]}>
          Share memories and connect with friends, across time.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={[styles.buttonText, { color: colors.card }]}>Get Started</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[styles.buttonText, { color: colors.primary }]}>I Have an Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '90%',
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});