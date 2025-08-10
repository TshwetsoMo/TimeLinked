// src/screens/FriendsFeedScreen.tsx
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
import { subscribeToConnections, getUserProfile } from '../services/users';
import { subscribeToFriendsFeed } from '../services/journal';
import type { JournalEntry, UserProfile } from '../types';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'FriendsFeed'>; // Add 'FriendsFeed' to your RootStackParamList

export default function FriendsFeedScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { colors } = useTheme();

  const [feedEntries, setFeedEntries] = useState<JournalEntry[]>([]);
  // State to cache author profile info
  const [authors, setAuthors] = useState<{ [id: string]: UserProfile }>({});
  const [loading, setLoading] = useState(true);

  // This complex effect handles the two-step data fetching process.
  useEffect(() => {
    if (!user) return;

    setLoading(true);

    // Step 1: Subscribe to the user's connections to get their friend IDs.
    const unsubConnections = subscribeToConnections(user.uid, (connections) => {
      const friendIds = connections.map(c => c.id);

      if (friendIds.length === 0) {
        // If the user has no friends, the feed will be empty.
        setFeedEntries([]);
        setLoading(false);
        return;
      }

      // Step 2: Use the friend IDs to subscribe to the friends feed.
      const unsubFeed = subscribeToFriendsFeed(friendIds, (entries) => {
        setFeedEntries(entries);
        
        // Step 3: Fetch profiles for any new authors in the feed.
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

      // Return the cleanup function for the feed subscription
      return () => unsubFeed();
    });

    // Return the cleanup function for the connections subscription
    return () => unsubConnections();
  }, [user]);

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
            <Text style={[styles.header, { color: colors.text }]}>Friends Feed</Text>
          }
          contentContainerStyle={{ paddingTop: spacing.sm }}
          ListEmptyComponent={
            <View style={styles.placeholderContainer}>
              <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
                Your friends haven't shared any journal entries yet. When they do, they'll appear here.
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SearchUsers')}>
                <Text style={[styles.link, { color: colors.primary }]}>Find More Friends</Text>
              </TouchableOpacity>
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
    marginBottom: spacing.md,
  },
  link: {
      fontSize: 16,
      fontWeight: 'bold',
  }
});