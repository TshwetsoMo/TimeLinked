// src/screens/CreateJournal.tsx
import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigation';
import { auth } from '../services/firebase';
import { subscribeToJournalEntries, createJournalEntry, updateJournalEntry } from '../services/journal';
import type { JournalEntry } from '../types';

type EntryWithMood = JournalEntry & { mood?: number };
type Props = NativeStackScreenProps<RootStackParamList, 'CreateJournal'>;

export default function CreateJournalScreen({ route, navigation }: Props) {
  const user = auth.currentUser!;
  const [draft, setDraft] = useState('');
  const [mood, setMood] = useState(3);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [entries, setEntries] = useState<EntryWithMood[]>([]);

  useEffect(() => {
    const unsub = subscribeToJournalEntries(user.uid, data => {
      setEntries(data as EntryWithMood[]);
    });
    return unsub;
  }, [user.uid]);

  useEffect(() => {
    if (route.params?.entryId) {
      const entry = entries.find(e => e.id === route.params!.entryId);
      if (entry) {
        setDraft(entry.content);
        setMood(entry.mood ?? 3);
        setEditingId(entry.id);
      }
    }
  }, [entries, route.params]);

  const handleSave = () => {
    if (!draft.trim()) return Alert.alert('Empty Entry', 'Please write something.');
    const op = editingId
      ? updateJournalEntry(editingId, draft, mood)
      : createJournalEntry(user.uid, draft, mood);

    op
      .then(() => {
        setDraft('');
        setMood(3);
        setEditingId(null);
        navigation.navigate('Journal');
      })
      .catch(err => Alert.alert('Error', err.message));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.heading}>
          {editingId ? 'Edit Entry' : 'New Journal Entry'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Write your thoughts..."
          multiline
          value={draft}
          onChangeText={setDraft}
        />
        <View style={styles.moodRow}>
          <Text>Mood: </Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={mood}
            onValueChange={setMood}
          />
          <Text>{mood}★</Text>
        </View>
        <Button title={editingId ? 'Update Entry' : 'Save Entry'} onPress={handleSave} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12,
    minHeight: 100, textAlignVertical: 'top', marginBottom: 8,
  },
  moodRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  slider: { flex: 1, marginHorizontal: 8 },
});

