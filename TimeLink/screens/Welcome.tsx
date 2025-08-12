// src/screens/WelcomeScreen.tsx
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
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  // Use custom hooks to get the global authentication state and current theme.
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  // This useEffect hook runs whenever the auth state changes.
  // It's the core of the automatic login feature.
  useEffect(() => {
    // If the initial authentication check is complete (`!loading`) and a user is logged in...
    if (!loading && user) {
      // ...redirect the user to the main Dashboard.
      // `navigation.replace` is used so the user cannot press the back button to return here.
      navigation.replace('Dashboard');
    }
  }, [user, loading, navigation]);

  // While the AuthProvider is checking for a persisted session, show a loading spinner.
  // This prevents the Welcome screen from briefly flashing for a returning user.
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // If not loading and no user is found, render the main welcome UI.
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
          {/* Button to navigate to the account creation screen. */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={[styles.buttonText, { color: colors.card }]}>Get Started</Text>
          </TouchableOpacity>
          {/* Button to navigate to the login screen for existing users. */}
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

// All styles use the theme's spacing and color objects for consistency.
const styles = StyleSheet.create({
  safe: { flex: 1 },
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