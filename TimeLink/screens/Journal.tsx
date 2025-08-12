// src/screens/JournalScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Import services, hooks, and types
import { RootStackParamList } from '../navigation/AppNavigation';
import { useAuth } from '../services/authContext';
import { useTheme } from '../theme/ThemeContext';
import { subscribeToMyJournalEntries, deleteJournalEntry } from '../services/journal';
import type { JournalEntry } from '../types';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'Journal'>;

export default function JournalScreen({ navigation }: Props) {
  // Get the global user object and the current theme.
  const { user } = useAuth();
  const { colors } = useTheme();

  // Local state to hold the unfiltered list of entries fetched from Firestore.
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  // Loading state to show a spinner during the initial data fetch.
  const [loading, setLoading] = useState(true);
  
  // Local state to manage the text in the search input and the selected mood.
  const [searchQuery, setSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState<number | null>(null);

  // This effect sets up the real-time data subscription.
  useEffect(() => {
    if (!user) return; // Exit if the user is not yet loaded.
    
    setLoading(true);
    // Calls the centralized service to listen for changes to the user's journal entries.
    // The callback function updates the local state whenever data changes on the backend.
    const unsubscribe = subscribeToMyJournalEntries(user.uid, (fetchedEntries) => {
      setEntries(fetchedEntries);
      setLoading(false); // Hide the spinner once the first batch of data arrives.
    });

    // The returned function is a cleanup mechanism. It's called when the screen is
    // unmounted to prevent memory leaks by closing the connection to Firestore.
    return () => unsubscribe();
  }, [user]);

  // This function performs client-side filtering based on the search query and mood filter.
  // `useMemo` is a performance optimization that ensures this filtering logic only re-runs
  // when the source `entries` array or the filter values actually change.
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = entry.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMood = moodFilter === null || entry.mood === moodFilter;
      return matchesSearch && matchesMood;
    });
  }, [entries, searchQuery, moodFilter]);

  // Handles deleting an entry.
  const handleDelete = (entryId: string) => {
    // Displays a native confirmation dialog to prevent accidental data loss.
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to permanently delete this journal entry?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          // If the user confirms, call the centralized `deleteJournalEntry` service.
          onPress: () => deleteJournalEntry(entryId).catch(err => Alert.alert("Error", err.message))
        }
      ]
    );
  };

  // Defines how to render a single journal entry card in the FlatList.
  const renderEntry = ({ item }: { item: JournalEntry }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.text }]}
      onPress={() => navigation.navigate('ReadJournal', { entryId: item.id })}
    >
      <Text style={[styles.entryDate, { color: colors.textMuted }]}>
        {item.createdAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </Text>
      <Text numberOfLines={3} style={[styles.entryContent, { color: colors.text }]}>
        {item.content}
      </Text>
      {item.mood && (
         <Text style={[styles.mood, { color: colors.textMuted }]}>
            Mood: {'★'.repeat(item.mood)}{'☆'.repeat(5 - item.mood)}
         </Text>
      )}
      <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.navigate('CreateJournal', { entryId: item.id })}>
            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>EDIT</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Text style={{ color: colors.notification, fontWeight: 'bold' }}>DELETE</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Renders a loading spinner during the initial data fetch.
  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* FlatList is a high-performance component for rendering scrollable lists. */}
      <FlatList
        data={filteredEntries}
        keyExtractor={item => item.id}
        renderItem={renderEntry}
        contentContainerStyle={styles.listContainer}
        // The ListHeaderComponent contains the UI that scrolls along with the list.
        ListHeaderComponent={
          <View>
            <Text style={[styles.header, { color: colors.text }]}>My Journal</Text>
            <TextInput
              style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Search in your journal..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {/* The Mood Filter UI can be added here. */}
          </View>
        }
        // This component is displayed when the data list is empty.
        // It provides helpful text to the user.
        ListEmptyComponent={
          <View style={styles.placeholderContainer}>
            <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
              {entries.length === 0 ? "Tap the '+' to write your first entry." : "No entries match your search."}
            </Text>
          </View>
        }
      />

      {/* A Floating Action Button (FAB) is a modern UI pattern for a primary screen action. */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.text }]}
        onPress={() => navigation.navigate('CreateJournal', {})}
      >
        <Text style={[styles.fabIcon, { color: colors.card }]}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// All styles are themed and use consistent spacing.
const styles = StyleSheet.create({
  safe: { flex: 1 },
  listContainer: { paddingHorizontal: spacing.md, paddingBottom: 80 },
  header: { fontSize: 32, fontWeight: 'bold', marginVertical: spacing.md },
  searchInput: { height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, fontSize: 16, marginBottom: spacing.md },
  card: {
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entryDate: { fontSize: 12, fontWeight: '600', marginBottom: spacing.sm, opacity: 0.7 },
  entryContent: { fontSize: 16, lineHeight: 22 },
  mood: { fontSize: 14, marginTop: spacing.sm, fontStyle: 'italic' },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.lg, borderTopWidth: 1, marginTop: spacing.md, paddingTop: spacing.md },
  placeholderContainer: { marginTop: 100, alignItems: 'center' },
  placeholderText: { fontSize: 16, fontStyle: 'italic' },
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
  fabIcon: { fontSize: 32, fontWeight: '300' },
});