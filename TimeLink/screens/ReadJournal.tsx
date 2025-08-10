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
  Platform
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Import our services, hooks, and types
import { RootStackParamList } from '../navigation/AppNavigation';
import { useTheme } from '../theme/useTheme';
import { getJournalEntry, deleteJournalEntry } from '../services/journal';
import type { JournalEntry } from '../types';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'ReadJournal'>;

export default function ReadJournalScreen({ route, navigation }: Props) {
  const { entryId } = route.params;
  const { colors } = useTheme();

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntry = async () => {
      setLoading(true);
      try {
        const fetchedEntry = await getJournalEntry(entryId);
        if (fetchedEntry) {
          setEntry(fetchedEntry);
        } else {
          Alert.alert("Not Found", "This journal entry no longer exists.");
          navigation.goBack();
        }
      } catch (err: any) {
        Alert.alert("Error", err.message);
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetchEntry();
  }, [entryId, navigation]);

  const handleDelete = () => {
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
              await deleteJournalEntry(entryId);
              navigation.goBack();
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          }
        }
      ]
    );
  };

  if (loading || !entry) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const visibilityInfo = {
    private: { icon: '🔒', text: 'Private (Only you can see this)' },
    friends: { icon: '👥', text: 'Friends Only' },
    public: { icon: '🌍', text: 'Public' },
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.date, { color: colors.textMuted }]}>
          {entry.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>

        <View style={[styles.metaBox, { borderColor: colors.border }]}>
            <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: colors.textMuted }]}>MOOD</Text>
                <Text style={styles.mood}>{'★'.repeat(entry.mood || 0)}{'☆'.repeat(5 - (entry.mood || 0))}</Text>
            </View>
            <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: colors.textMuted }]}>VISIBILITY</Text>
                <Text style={[styles.visibility, { color: colors.text }]}>{visibilityInfo[entry.visibility].icon} {visibilityInfo[entry.visibility].text}</Text>
            </View>
        </View>

        <Text style={[styles.content, { color: colors.text }]}>{entry.content}</Text>
      </ScrollView>

      {/* Action buttons at the bottom */}
      <View style={[styles.actions, { borderTopColor: colors.border }]}>
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
  metaItem: { alignItems: 'center' },
  metaLabel: { fontSize: 12, fontWeight: 'bold', marginBottom: spacing.xs },
  mood: { fontSize: 20, color: '#FFC107' },
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
    borderTopWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.9)', // Or a themed color
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