// src/screens/ReadJournal.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Button,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigation';
import { getJournalEntry, deleteJournalEntry } from '../services/journal';
import { JournalEntry } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ReadJournal'>;

export default function ReadJournalScreen({ route, navigation }: Props) {
  const { entryId } = route.params;
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJournalEntry(entryId)
      .then(setEntry)
      .finally(() => setLoading(false));
  }, [entryId]);

  const handleDelete = () => {
    Alert.alert(
        'Delete Entry',
        'Are you sure you want to delete this journal entry?',
        [
        {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => console.log('Deletion cancelled'),
        },
        {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
            try {
                await deleteJournalEntry(entryId);
                navigation.navigate('Journal'); // Only navigate after deletion
            } catch (error) {
                console.error('Failed to delete journal entry:', error);
                Alert.alert('Error', 'Could not delete entry. Please try again.');
            }
            },
        },
        ],
        { cancelable: true }
    );
    };


  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!entry) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.error}>Journal entry not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.date}>
          {entry.createdAt.toLocaleDateString()} at {entry.createdAt.toLocaleTimeString()}
        </Text>
        <Text style={styles.mood}>
          Mood: {'★'.repeat(entry.mood ?? 3)}{'☆'.repeat(5 - (entry.mood ?? 3))}
        </Text>
        <Text style={styles.content}>{entry.content}</Text>

        {/* Edit Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Edit"
            onPress={() => navigation.navigate('CreateJournal', { entryId: entry.id })}
          />
        </View>

        {/* Delete Button */}
        <View style={styles.buttonContainer}>
          <Button title="Delete" onPress={handleDelete} color="red" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20 },
  date: { fontSize: 14, color: '#888', marginBottom: 10 },
  mood: { fontSize: 16, marginBottom: 10 },
  content: { fontSize: 18, marginBottom: 20 },
  error: { fontSize: 16, color: 'red', textAlign: 'center' },
  buttonContainer: { marginTop: 10 },
});