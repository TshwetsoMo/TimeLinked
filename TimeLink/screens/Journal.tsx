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

// Import our new services, hooks, and types
import { RootStackParamList } from '../navigation/AppNavigation';
import { useAuth } from '../services/authContext';
import { useTheme } from '../theme/useTheme';
import { subscribeToMyJournalEntries, deleteJournalEntry } from '../services/journal';
import type { JournalEntry } from '../types';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'Journal'>;

export default function JournalScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { colors } = useTheme();

  // State for the real-time entries and UI
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for client-side filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState<number | null>(null);

  // ✅ Switched to a real-time subscription for a better UX
  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    // This listener will automatically update when data changes in Firestore.
    const unsubscribe = subscribeToMyJournalEntries(user.uid, (fetchedEntries) => {
      setEntries(fetchedEntries);
      setLoading(false);
    });

    // Cleanup the subscription when the component unmounts
    return () => unsubscribe();
  }, [user]);

  // Memoize the filtered entries to prevent re-calculating on every render
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = entry.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMood = moodFilter === null || entry.mood === moodFilter;
      return matchesSearch && matchesMood;
    });
  }, [entries, searchQuery, moodFilter]);

  const handleDelete = (entryId: string) => {
    // ✅ Add a confirmation alert before deleting
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to permanently delete this journal entry?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => deleteJournalEntry(entryId).catch(err => Alert.alert("Error", err.message))
        }
      ]
    );
  };

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
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => navigation.navigate('CreateJournal', { entryId: item.id })}>
            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>EDIT</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Text style={{ color: colors.notification, fontWeight: 'bold' }}>DELETE</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredEntries}
        keyExtractor={item => item.id}
        renderItem={renderEntry}
        contentContainerStyle={styles.listContainer}
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
            {/* Mood Filter Component */}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.placeholderContainer}>
            <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
              {entries.length === 0 ? "Tap the '+' to write your first entry." : "No entries match your search."}
            </Text>
          </View>
        }
      />

      {/* ✅ Floating Action Button for creating a new entry */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('CreateJournal', {})}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

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
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.lg, borderTopWidth: 1, borderTopColor: '#eee', marginTop: spacing.md, paddingTop: spacing.md },
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
  fabIcon: { fontSize: 32, color: 'white', fontWeight: '300' },
});