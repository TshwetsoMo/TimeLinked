// src/screens/OpenCapsuleScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Import services, hooks, and types
import { RootStackParamList } from '../navigation/AppNavigation';
import { getCapsule, markCapsuleAsRead } from '../services/capsules';
import { getUserProfile } from '../services/users';
import { useAuth } from '../services/authContext';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import type { Capsule, UserProfile } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'OpenCapsule'>;

export default function OpenCapsuleScreen({ route, navigation }: Props) {
  // Get the capsuleId from navigation and the global user/theme state.
  const { capsuleId } = route.params;
  const { colors } = useTheme();
  const { user } = useAuth();

  // Local state to hold all the data needed to render the screen.
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [sender, setSender] = useState<UserProfile | null>(null);
  const [recipient, setRecipient] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // This effect orchestrates the fetching of all required data when the screen loads.
  useEffect(() => {
    const fetchAllData = async () => {
      if (!user) return; // Safety check.

      try {
        // Step 1: Fetch the core data for the capsule itself.
        const capsuleDoc = await getCapsule(capsuleId);
        if (!capsuleDoc) {
          Alert.alert('Not Found', 'This time capsule could not be found.');
          navigation.goBack();
          return;
        }
        setCapsule(capsuleDoc);

        // Step 2: Concurrently fetch the profiles of both the sender and the recipient.
        // `Promise.all` is used for efficiency, running both fetches at the same time.
        const [senderProfile, recipientProfile] = await Promise.all([
          getUserProfile(capsuleDoc.userId),
          getUserProfile(capsuleDoc.recipientId),
        ]);
        setSender(senderProfile);
        setRecipient(recipientProfile);

        // Step 3: Automatically mark the capsule as "read" (`isDelivered: true`).
        // This crucial logic only runs IF the current user is the recipient,
        // the capsule is unread, AND the delivery date has passed.
        if (
          user.uid === capsuleDoc.recipientId &&
          !capsuleDoc.isDelivered &&
          capsuleDoc.deliveryDate <= new Date()
        ) {
          await markCapsuleAsRead(capsuleId);
          // Update local state immediately to reflect the change in the UI without a re-fetch.
          setCapsule({ ...capsuleDoc, isDelivered: true });
        }

      } catch (err: any) {
        Alert.alert('Error', err.message || "Could not load capsule.");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [capsuleId, navigation, user]); // Re-runs if the capsuleId changes.

  // Display a loading spinner until all initial data has been fetched.
  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // Display a fallback message if the capsule could not be loaded.
  if (!capsule) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{color: colors.text}}>Could not load capsule.</Text>
      </SafeAreaView>
    );
  }

  // A boolean to determine if the message content should be hidden.
  const isLocked = capsule.deliveryDate > new Date();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* The main card, styled to look like a digital letter or postcard. */}
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.text }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {capsule.title ?? 'A Message Through Time'}
          </Text>
          
          {/* Metadata section displaying sender, recipient, and delivery date. */}
          <View style={[styles.metaRow, { borderBottomColor: colors.border }]}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>FROM</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>{sender?.displayName || 'Unknown'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>TO</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>{recipient?.displayName || 'Unknown'}</Text>
            </View>
          </View>

          <View style={[styles.metaRow, { borderBottomColor: colors.border }]}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>DELIVERS ON</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>
                {capsule.deliveryDate.toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Main message area. Conditionally renders the message or a "locked" view. */}
          <View style={styles.messageContainer}>
            {isLocked ? (
              <View style={styles.lockedView}>
                <Text style={[styles.lockedIcon, { color: colors.primary }]}>🔒</Text>
                <Text style={[styles.lockedText, { color: colors.textMuted }]}>
                  This message is sealed and will unlock on the delivery date.
                </Text>
              </View>
            ) : (
              <Text style={[styles.message, { color: colors.text }]}>
                {capsule.message}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.buttonText, { color: colors.card }]}>Go Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// All styles are themed and use consistent spacing.
const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flexGrow: 1, padding: spacing.md, justifyContent: 'center' },
  card: {
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingVertical: spacing.md,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  messageContainer: {
    paddingVertical: spacing.xl,
    minHeight: 200,
    justifyContent: 'center',
  },
  message: {
    fontSize: 18,
    lineHeight: 28,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  lockedView: {
    alignItems: 'center',
    padding: spacing.md,
  },
  lockedIcon: {
      fontSize: 48,
  },
  lockedText: {
      fontSize: 16,
      marginTop: spacing.md,
      textAlign: 'center'
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});