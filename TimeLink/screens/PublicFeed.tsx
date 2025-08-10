// src/screens/PublicFeedScreen.tsx
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
import { useTheme } from '../theme/useTheme';
import { getUserProfile } from '../services/users';
import { subscribeToPublicFeed } from '../services/journal';
import type { JournalEntry, UserProfile } from '../types';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'PublicFeed'>; // Add 'PublicFeed' to your RootStackParamList

export default function PublicFeedScreen({ navigation }: Props) {
  const { colors } = useTheme();

  const [feedEntries, setFeedEntries] = useState<JournalEntry[]>([]);
  // State to cache author profile info
  const [authors, setAuthors] = useState<{ [id: string]: UserProfile }>({});
  const [loading, setLoading] = useState(true);

  // This effect handles fetching the public feed
  useEffect(() => {
    setLoading(true);

    // Subscribe to all entries with 'public' visibility
    const unsubscribe = subscribeToPublicFeed((entries) => {
      setFeedEntries(entries);
      
      // Fetch profiles for any new authors in the feed
      const authorIds = new Set(entries.map(e => e.userId));
      authorIds.forEach(id => {
        if (!authors[id]) {
          getUserProfile(id).then(profile => {
            if (profile) {
              setAuthors(prev => ({ ...prev, [id]: profile }));
            }
          });
        }
      });
      setLoading(false);
    });

    // Cleanup the subscription on unmount
    return () => unsubscribe();
  }, []);

  const renderFeedItem = ({ item }: { item: JournalEntry }) => {
    const author = authors[item.userId];

    return (
      <View style={[styles.feedCard, { backgroundColor: colors.card, shadowColor: colors.text }]}>
        <View style={styles.cardHeader}>
          <Image
            source={author?.photoURL ? { uri: author.photoURL } : require('../assets/logo.png')}
            style={styles.authorImage}
          />
          <View>
            <Text style={[styles.authorName, { color: colors.text }]}>{author?.displayName || '...'}</Text>
            <Text style={[styles.dateText, { color: colors.textMuted }]}>
              {item.createdAt.toLocaleDateString()}
            </Text>
          </View>
        </View>
        <Text style={[styles.cardContent, { color: colors.text }]}>{item.content}</Text>
        {item.mood && (
          <Text style={[styles.moodText, { color: colors.textMuted }]}>
            Mood: {'★'.repeat(item.mood)}{'☆'.repeat(5 - item.mood)}
          </Text>
        )}
      </View>
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
        <FlatList
          data={feedEntries}
          keyExtractor={(item) => item.id}
          renderItem={renderFeedItem}
          ListHeaderComponent={
            <Text style={[styles.header, { color: colors.text }]}>Explore Public Feed</Text>
          }
          contentContainerStyle={{ paddingTop: spacing.sm }}
          ListEmptyComponent={
            <View style={styles.placeholderContainer}>
              <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
                No one has shared a public journal entry yet. Be the first!
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
  container: { flex: 1, paddingHorizontal: spacing.md },
  header: { fontSize: 28, fontWeight: 'bold', paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
  feedCard: {
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  authorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.md,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
  },
  cardContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  moodText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: spacing.md,
    textAlign: 'right',
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