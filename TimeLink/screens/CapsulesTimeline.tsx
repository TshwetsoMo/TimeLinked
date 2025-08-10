// src/screens/CapsulesTimelineScreen.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  Alert,
  View,
  Text,
  SectionList, // ✅ Use SectionList for a better UI
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Import our new services, hooks, and types
import { RootStackParamList } from '../navigation/AppNavigation';
import { useAuth } from '../services/authContext';
import { useTheme } from '../theme/useTheme';
import { subscribeToSentCapsules, deleteCapsule } from '../services/capsules';
import { getUserProfile } from '../services/users';
import type { Capsule, UserProfile } from '../types';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'CapsulesTimeline'>;

export default function CapsulesTimelineScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { colors } = useTheme();

  const [capsules, setCapsules] = useState<Capsule[]>([]);
  // ✅ State to cache recipient profile info
  const [recipients, setRecipients] = useState<{ [id: string]: UserProfile }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    // Subscribe to the capsules SENT by the current user
    const unsubscribe = subscribeToSentCapsules(user.uid, (fetchedCapsules) => {
      setCapsules(fetchedCapsules);

      // ✅ Fetch recipient profiles for any new IDs
      const recipientIds = new Set(fetchedCapsules.map(c => c.recipientId));
      recipientIds.forEach(id => {
        // Only fetch if we don't already have the profile
        if (!recipients[id]) {
          getUserProfile(id).then(profile => {
            if (profile) {
              setRecipients(prev => ({ ...prev, [id]: profile }));
            }
          });
        }
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Memoize the data transformation into sections for the SectionList
  const sections = useMemo(() => {
    const now = new Date();
    const upcoming = capsules
      .filter(c => c.deliveryDate > now)
      .sort((a, b) => a.deliveryDate.getTime() - b.deliveryDate.getTime());

    const past = capsules
      .filter(c => c.deliveryDate <= now)
      .sort((a, b) => b.deliveryDate.getTime() - a.deliveryDate.getTime());

    return [
      { title: 'Upcoming', data: upcoming },
      { title: 'Past & Delivered', data: past },
    ];
  }, [capsules]);
  
  const handleDelete = (capsuleId: string) => {
    Alert.alert(
      "Delete Capsule",
      "Are you sure you want to permanently delete this capsule? This cannot be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCapsule(capsuleId).catch(err => Alert.alert("Error", err.message)),
        },
      ]
    );
  };

  const renderCapsule = ({ item }: { item: Capsule }) => {
    const isUnlocked = item.deliveryDate <= new Date();
    const recipientName = recipients[item.recipientId]?.displayName || '...loading';

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.text }]}
        onPress={() => navigation.navigate('OpenCapsule', { capsuleId: item.id })}
      >
        <Text style={[styles.title, { color: colors.text }]}>{item.title ?? 'Untitled Capsule'}</Text>
        {/* ✅ Display the recipient's name */}
        <Text style={[styles.meta, { color: colors.textMuted }]}>To: {recipientName}</Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          Delivers: {item.deliveryDate.toLocaleDateString()}
        </Text>
        
        <View style={[styles.statusRow, { backgroundColor: isUnlocked ? colors.primary : colors.border }]}>
            <Text style={[styles.statusText, { color: isUnlocked ? colors.card : colors.textMuted }]}>
                {isUnlocked ? '🔓 UNLOCKED' : '🔒 PENDING'}
            </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.border }]}
            onPress={() => navigation.navigate('CreateCapsule', { capsuleId: item.id })}>
                <Text style={{color: colors.text, fontWeight: 'bold'}}>EDIT</Text>
            </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.notification }]}
            onPress={() => handleDelete(item.id)}>
              <Text style={{color: colors.card, fontWeight: 'bold'}}>DELETE</Text>
            </TouchableOpacity>
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
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderCapsule}
        contentContainerStyle={styles.listContainer}
        renderSectionHeader={({ section: { title, data } }) => (
          // Only render header if the section has data
          data.length > 0 ? <Text style={[styles.header, { color: colors.text }]}>{title}</Text> : null
        )}
        ListEmptyComponent={
          <View style={styles.placeholderContainer}>
            <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
              You haven't sent any time capsules yet. Tap the '+' to create one!
            </Text>
          </View>
        }
      />
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('CreateCapsule', {})}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  listContainer: { paddingHorizontal: spacing.md, paddingBottom: 80 },
  header: { fontSize: 24, fontWeight: 'bold', marginVertical: spacing.md },
  card: {
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: spacing.sm },
  meta: { fontSize: 14, marginBottom: spacing.xs },
  statusRow: {
    borderRadius: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignSelf: 'flex-start',
    marginVertical: spacing.md,
  },
  statusText: {
      fontSize: 12,
      fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  actionButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
  },
  placeholderContainer: { marginTop: 100, alignItems: 'center', padding: spacing.lg },
  placeholderText: { fontSize: 16, fontStyle: 'italic', textAlign: 'center' },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabIcon: { fontSize: 32, color: 'white', fontWeight: '300' },
});