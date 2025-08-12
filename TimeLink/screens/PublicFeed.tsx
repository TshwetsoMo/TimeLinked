// src/screens/PublicFeedScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Import services, hooks, and types
import { RootStackParamList } from '../navigation/AppNavigation';
import { useTheme } from '../theme/ThemeContext';
import { getUserProfile } from '../services/users';
import { subscribeToPublicFeed } from '../services/journal';
import type { JournalEntry, UserProfile } from '../types';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'PublicFeed'>;

export default function PublicFeedScreen({ navigation }: Props) {
  // Get the current theme colors for styling.
  const { colors } = useTheme();

  // Local state to hold the list of public journal entries.
  const [feedEntries, setFeedEntries] = useState<JournalEntry[]>([]);
  // A state object to cache author profile data, preventing redundant Firestore reads.
  const [authors, setAuthors] = useState<{ [id: string]: UserProfile }>({});
  const [loading, setLoading] = useState(true);

  // This effect sets up the real-time subscription to the public feed.
  // The empty dependency array `[]` means it runs only once when the screen mounts.
  useEffect(() => {
    setLoading(true);

    // Calls the centralized service to listen for all journal entries with 'public' visibility.
    const unsubscribe = subscribeToPublicFeed((entries) => {
      setFeedEntries(entries);
      
      // After getting the entries, efficiently fetch profiles for any new authors.
      const authorIds = new Set(entries.map(e => e.userId));
      authorIds.forEach(id => {
        // Only fetch if the author's profile is not already in our cache.
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

    // Cleanup the subscription on unmount to prevent memory leaks.
    return () => unsubscribe();
  }, []);

  // Defines how to render a single feed item card, consistent with the Friends Feed.
  const renderFeedItem = ({ item }: { item: JournalEntry }) => {
    const author = authors[item.userId];

    return (
      <View style={[styles.feedCard, { backgroundColor: colors.card, shadowColor: colors.text }]}>
        <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
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
          <Text style={[styles.moodText, { color: colors.accent }]}>
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
          // Provides a helpful message when no public entries exist.
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

// All styles are themed and use consistent spacing.
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