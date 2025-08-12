// src/screens/InboxScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Import services, hooks, and types
import { RootStackParamList } from '../navigation/AppNavigation';
import { useAuth } from '../services/authContext';
import { useTheme } from '../theme/ThemeContext';
import { subscribeToReceivedCapsules } from '../services/capsules';
import { getUserProfile } from '../services/users';
import type { Capsule, UserProfile } from '../types';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'Inbox'>;

export default function InboxScreen({ navigation }: Props) {
  // Get global user state and current theme colors.
  const { user } = useAuth();
  const { colors } = useTheme();

  // Local state to hold the list of received capsules.
  const [receivedCapsules, setReceivedCapsules] = useState<Capsule[]>([]);
  // A state object to cache sender profile data, preventing redundant Firestore reads.
  const [senders, setSenders] = useState<{ [id: string]: UserProfile }>({});
  const [loading, setLoading] = useState(true);

  // This effect sets up the real-time data subscription for capsules RECEIVED by the user.
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    // Calls the centralized service to listen for capsules where the user is the recipient.
    // The service itself filters for capsules that are past their delivery date.
    const unsubscribe = subscribeToReceivedCapsules(user.uid, (fetchedCapsules) => {
      setReceivedCapsules(fetchedCapsules);

      // After getting the capsules, efficiently fetch profiles for any new senders.
      const senderIds = new Set(fetchedCapsules.map(c => c.userId));
      senderIds.forEach(id => {
        // Only fetch if the sender's profile is not already in our cache.
        if (!senders[id]) {
          getUserProfile(id).then(profile => {
            if (profile) {
              setSenders(prev => ({ ...prev, [id]: profile }));
            }
          });
        }
      });

      setLoading(false);
    });

    // Cleanup the subscription on unmount to prevent memory leaks.
    return () => unsubscribe();
  }, [user]);

  // Defines how to render a single received capsule card in the list.
  const renderReceivedCapsule = ({ item }: { item: Capsule }) => {
    const senderName = senders[item.userId]?.displayName || '...';
    // `isDelivered` doubles as our "isRead" flag.
    const isNew = !item.isDelivered;

    return (
      <TouchableOpacity
        style={[styles.capsuleCard, { backgroundColor: colors.card, shadowColor: colors.text }]}
        // Tapping a card navigates to the universal OpenCapsuleScreen to view the content.
        onPress={() => navigation.navigate('OpenCapsule', { capsuleId: item.id })}
      >
        <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
          {/* A visual indicator is shown for new, unread messages. */}
          {isNew && <View style={[styles.newIndicator, { backgroundColor: colors.primary }]} />}
          <Text
            style={[styles.capsuleTitle, { color: colors.text, fontWeight: isNew ? 'bold' : 'normal' }]}
            numberOfLines={1}
          >
            {item.title || 'A message for you'}
          </Text>
        </View>
        <View style={styles.cardBody}>
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
                From: <Text style={{fontWeight: 'bold', color: colors.text}}>{senderName}</Text>
            </Text>
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
                Unlocked: {item.deliveryDate.toLocaleDateString()}
            </Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Renders a loading spinner until the initial data has been fetched.
  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Text style={[styles.header, { color: colors.text }]}>Your Inbox</Text>
        <FlatList
          data={receivedCapsules}
          keyExtractor={(item) => item.id}
          renderItem={renderReceivedCapsule}
          contentContainerStyle={{ paddingTop: spacing.sm }}
          // Provides a helpful message when the user has no received capsules.
          ListEmptyComponent={
            <View style={styles.placeholderContainer}>
              <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
                When friends send you Time Capsules, they'll appear here after their delivery date.
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

// All styles are themed and use consistent spacing.
const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: spacing.md },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: spacing.md },
  capsuleCard: {
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
  },
  newIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  capsuleTitle: {
    fontSize: 18,
    flex: 1,
  },
  cardBody: {
      paddingTop: spacing.md,
  },
  metaText: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  placeholderContainer: {
    flex: 1,
    marginTop: 100,
    alignItems: 'center',
    padding: spacing.lg,
  },
  placeholderText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});