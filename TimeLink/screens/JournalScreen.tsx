// src/screens/Journal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Button,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigation';
import { auth } from '../services/firebase';
import { fetchJournalEntriesPaginated, deleteJournalEntry } from '../services/journal';
import type { JournalEntry } from '../types';
import type { QueryDocumentSnapshot } from 'firebase/firestore';

type EntryWithMood = JournalEntry & { mood?: number };
type Props = NativeStackScreenProps<RootStackParamList, 'Journal'>;

const PAGE_SIZE = 10;

export default function JournalScreen({ navigation }: Props) {
  const user = auth.currentUser!;
  const [entries, setEntries] = useState<EntryWithMood[]>([]);
  const [search, setSearch] = useState('');
  const [moodFilter, setMoodFilter] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);

  // Load first page
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchJournalEntriesPaginated(user.uid, PAGE_SIZE)
      .then(({ entries: newEntries, lastVisible }) => {
        if (!mounted) return;
        setEntries(newEntries);
        setLastDoc(lastVisible ?? null);
        setHasMore(newEntries.length === PAGE_SIZE);
      })
      .catch(err => alert(err.message))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user.uid]);

  // Load more entries on scroll end
  const loadMore = useCallback(() => {
    if (loadingMore || loading || !hasMore) return;

    if (!lastDoc) return;

    setLoadingMore(true);

    fetchJournalEntriesPaginated(user.uid, PAGE_SIZE, lastDoc)
      .then(({ entries: newEntries, lastVisible }) => {
        setEntries(prev => [...prev, ...newEntries]);
        setLastDoc(lastVisible ?? null);
        setHasMore(newEntries.length === PAGE_SIZE);
      })
      .catch(err => alert(err.message))
      .finally(() => setLoadingMore(false));
  }, [user.uid, lastDoc, loadingMore, loading, hasMore]);

  const filtered = entries.filter(e => {
    const matchesSearch = e.content.toLowerCase().includes(search.toLowerCase());
    const matchesMood = moodFilter === null || e.mood === moodFilter;
    return matchesSearch && matchesMood;
  });

  const renderEntry = ({ item }: { item: EntryWithMood }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('ReadJournal', { entryId: item.id })}
      style={styles.card}
    >
      <Text style={styles.entryDate}>
        {item.createdAt.toLocaleDateString()} at {item.createdAt.toLocaleTimeString()}
      </Text>
      <Text style={styles.entryContent}>{item.content}</Text>
      <Text style={styles.mood}>
        Mood: {'★'.repeat(item.mood ?? 3)}{'☆'.repeat(5 - (item.mood ?? 3))}
      </Text>
      <View style={styles.cardButtons}>
        <Button
          title="Edit"
          onPress={() =>
            navigation.navigate('CreateJournal', { entryId: item.id })
          }
        />
        <Button
          title="Delete"
          color="#c00"
          onPress={() =>
            deleteJournalEntry(item.id).catch(err => alert(err.message))
          }
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TextInput
          style={styles.search}
          placeholder="Search entries…"
          value={search}
          onChangeText={setSearch}
        />

        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by Mood:</Text>
          <View style={styles.moodRow}>
            {[1, 2, 3, 4, 5].map(mood => (
              <TouchableOpacity
                key={mood}
                onPress={() => setMoodFilter(moodFilter === mood ? null : mood)}
                style={[
                  styles.moodButton,
                  moodFilter === mood && styles.moodButtonSelected
                ]}
              >
                <Text style={styles.moodButtonText}>{'★'.repeat(mood)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            renderItem={renderEntry}
            contentContainerStyle={styles.list}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <Text style={styles.placeholder}>No entries yet.</Text>
            }
            ListFooterComponent={
              loadingMore ? <ActivityIndicator style={{ marginVertical: 12 }} /> : null
            }
          />
        )}

        <Button
          title="Create New Entry"
          onPress={() => navigation.navigate('CreateJournal', { entryId: undefined })}
        />

        <View style={styles.homeButtonContainer}>
          <Button
            title="Home"
            color="#444"
            onPress={() => navigation.navigate('Dashboard')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 16 },
  search: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  list: { paddingBottom: 16 },
  card: {
    backgroundColor: '#fafafa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  entryDate: { fontSize: 12, color: '#777', marginBottom: 6 },
  entryContent: { fontSize: 16, marginBottom: 6 },
  mood: { fontSize: 14, marginBottom: 8 },
  cardButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  placeholder: { textAlign: 'center', color: '#777', marginTop: 40 },

  homeButtonContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop: 12,
    alignSelf: 'stretch',
  },

  filterContainer: { marginBottom: 12 },
  filterLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    backgroundColor: '#eee',
    marginHorizontal: 2,
    flex: 1,
    alignItems: 'center',
  },
  moodButtonSelected: {
    backgroundColor: '#cdeaff',
    borderColor: '#00a',
  },
  moodButtonText: {
    fontSize: 16,
  },
});