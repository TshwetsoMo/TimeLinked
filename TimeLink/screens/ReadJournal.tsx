// src/screens/ReadJournalScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Import services, hooks, and types
import { RootStackParamList } from '../navigation/AppNavigation';
import { useTheme } from '../theme/ThemeContext';
import { getJournalEntry, deleteJournalEntry } from '../services/journal';
import type { JournalEntry } from '../types';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'ReadJournal'>;

export default function ReadJournalScreen({ route, navigation }: Props) {
  // Get the entryId passed through navigation and the current theme colors.
  const { entryId } = route.params;
  const { colors } = useTheme();

  // Local state to hold the fetched journal entry.
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  // Loading state to show a spinner during the data fetch.
  const [loading, setLoading] = useState(true);

  // This effect fetches the specific journal entry from Firestore when the screen loads.
  useEffect(() => {
    const fetchEntry = async () => {
      setLoading(true);
      try {
        // Calls the centralized service to get a single document by its ID.
        const fetchedEntry = await getJournalEntry(entryId);
        if (fetchedEntry) {
          setEntry(fetchedEntry); // On success, save the data to state.
        } else {
          // If the document doesn't exist (e.g., deleted), show an alert and go back.
          Alert.alert("Not Found", "This journal entry no longer exists.");
          navigation.goBack();
        }
      } catch (err: any) {
        Alert.alert("Error", err.message);
        navigation.goBack();
      } finally {
        setLoading(false); // Hide the spinner.
      }
    };
    fetchEntry();
  }, [entryId, navigation]); // This effect re-runs only if the `entryId` changes.

  // Handles deleting the current entry.
  const handleDelete = () => {
    // Displays a native confirmation dialog to prevent accidental deletion.
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to permanently delete this journal entry?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              // Calls the centralized service to delete the document.
              await deleteJournalEntry(entryId);
              navigation.goBack(); // Navigate back on successful deletion.
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          }
        }
      ]
    );
  };

  // Renders a loading spinner until the entry data has been fetched.
  if (loading || !entry) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // A helper object to provide user-friendly text for each visibility status.
  const visibilityInfo = {
    private: { icon: '🔒', text: 'Private' },
    friends: { icon: '👥', text: 'Friends Only' },
    public: { icon: '🌍', text: 'Public' },
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.date, { color: colors.textMuted }]}>
          {entry.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>

        {/* This box displays metadata about the entry: mood and visibility. */}
        <View style={[styles.metaBox, { borderColor: colors.border }]}>
            <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: colors.textMuted }]}>MOOD</Text>
                <Text style={[styles.mood, { color: colors.accent }]}>{'★'.repeat(entry.mood || 0)}{'☆'.repeat(5 - (entry.mood || 0))}</Text>
            </View>
            <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: colors.textMuted }]}>VISIBILITY</Text>
                <Text style={[styles.visibility, { color: colors.text }]}>{visibilityInfo[entry.visibility].icon} {visibilityInfo[entry.visibility].text}</Text>
            </View>
        </View>

        {/* This displays the main content of the journal entry. */}
        <Text style={[styles.content, { color: colors.text }]}>{entry.content}</Text>
      </ScrollView>

      {/* A persistent action bar at the bottom of the screen for editing and deleting. */}
      <View style={[styles.actions, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]} 
            onPress={() => navigation.navigate('CreateJournal', { entryId: entry.id })}
        >
            <Text style={[styles.buttonText, { color: colors.card }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.notification }]} 
            onPress={handleDelete}
        >
            <Text style={[styles.buttonText, { color: colors.card }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// All styles are themed and use consistent spacing.
const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: 100 },
  date: { fontSize: 16, textAlign: 'center', marginBottom: spacing.md },
  metaBox: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      marginBottom: spacing.lg,
  },
  metaItem: { alignItems: 'center', flex: 1 },
  metaLabel: { fontSize: 12, fontWeight: 'bold', marginBottom: spacing.xs },
  mood: { fontSize: 20 },
  visibility: { fontSize: 14, fontWeight: '500' },
  content: { fontSize: 18, lineHeight: 28, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.md,
    paddingBottom: 30, // Extra padding for safe area
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});