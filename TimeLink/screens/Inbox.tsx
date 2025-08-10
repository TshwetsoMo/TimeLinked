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
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Import our services, hooks, and types
import { RootStackParamList } from '../navigation/AppNavigation';
import { useAuth } from '../services/authContext';
import { useTheme } from '../theme/useTheme';
import { subscribeToReceivedCapsules } from '../services/capsules';
import { getUserProfile } from '../services/users';
import type { Capsule, UserProfile } from '../types';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'Inbox'>; // Add 'Inbox' to your RootStackParamList

export default function InboxScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { colors } = useTheme();

  const [receivedCapsules, setReceivedCapsules] = useState<Capsule[]>([]);
  // State to cache sender profile info for efficiency
  const [senders, setSenders] = useState<{ [id: string]: UserProfile }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    // This subscribes to capsules SENT TO the current user that are PAST their delivery date.
    const unsubscribe = subscribeToReceivedCapsules(user.uid, (fetchedCapsules) => {
      setReceivedCapsules(fetchedCapsules);

      // After getting the capsules, fetch the profile for any new sender.
      const senderIds = new Set(fetchedCapsules.map(c => c.userId));
      senderIds.forEach(id => {
        // Only fetch if we don't already have the profile cached in state.
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

    return () => unsubscribe();
  }, [user]);

  const renderReceivedCapsule = ({ item }: { item: Capsule }) => {
    const senderName = senders[item.userId]?.displayName || '...';
    const isNew = !item.isDelivered;

    return (
      <TouchableOpacity
        style={[styles.capsuleCard, { backgroundColor: colors.card, shadowColor: colors.text }]}
        onPress={() => navigation.navigate('OpenCapsule', { capsuleId: item.id })}
      >
        <View style={styles.cardHeader}>
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
      borderBottomColor: '#eee',
  },
  newIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  capsuleTitle: {
    fontSize: 18,
    flex: 1, // Allow text to shrink if needed
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