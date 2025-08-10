// src/screens/CreateJournalScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Import our new services, hooks, and types
import { RootStackParamList } from '../navigation/AppNavigation';
import { useAuth } from '../services/authContext';
import { useTheme } from '../theme/useTheme';
import { createJournalEntry, updateJournalEntry, getJournalEntry } from '../services/journal';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateJournal'>;

// For the new visibility options
type Visibility = 'private' | 'friends' | 'public';

export default function CreateJournalScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  const { colors } = useTheme();

  // Get entryId for editing, if it exists
  const { entryId } = route.params || {};

  // State for the form
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<number>(3);
  // ✅ State for the new visibility feature
  const [visibility, setVisibility] = useState<Visibility>('private');
  
  const [loading, setLoading] = useState(false); // For fetching initial data on edit
  const [saving, setSaving] = useState(false); // For the submission process

  // ✅ Efficiently load a single entry for editing
  useEffect(() => {
    const loadEntryForEditing = async () => {
      if (entryId) {
        setLoading(true);
        try {
          const entry = await getJournalEntry(entryId);
          if (entry) {
            setContent(entry.content);
            setMood(entry.mood || 3);
            setVisibility(entry.visibility);
          } else {
            Alert.alert('Error', 'Journal entry not found.');
            navigation.goBack();
          }
        } catch (err: any) {
          Alert.alert('Error', err.message);
          navigation.goBack();
        } finally {
          setLoading(false);
        }
      }
    };
    loadEntryForEditing();
  }, [entryId, navigation]);

  const handleSave = async () => {
    if (!user) return;
    if (!content.trim()) {
      return Alert.alert('Empty Entry', 'Please write something in your journal before saving.');
    }

    setSaving(true);
    try {
      if (entryId) {
        // ✅ Call the updated service function with a data object
        await updateJournalEntry(entryId, { content, mood, visibility });
        Alert.alert('Success', 'Your entry has been updated.');
      } else {
        // ✅ Call the new service function with visibility
        await createJournalEntry(user.uid, content, visibility, mood);
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={[styles.header, { color: colors.text }]}>
            {entryId ? 'Edit Your Entry' : 'How are you today?'}
          </Text>

          <TextInput
            style={[styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="Write your thoughts, memories, and feelings..."
            placeholderTextColor={colors.textMuted}
            multiline
            value={content}
            onChangeText={setContent}
          />

          {/* Mood Selector */}
          <Text style={[styles.label, { color: colors.text }]}>Your Mood</Text>
          <View style={styles.moodSelector}>
            {[1, 2, 3, 4, 5].map((level) => (
              <TouchableOpacity key={level} onPress={() => setMood(level)}>
                <Text style={[styles.moodStar, { opacity: mood >= level ? 1 : 0.3 }]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ✅ Visibility Selector */}
          <Text style={[styles.label, { color: colors.text }]}>Who can see this?</Text>
          {(['private', 'friends', 'public'] as Visibility[]).map(level => (
            <TouchableOpacity
              key={level}
              style={[
                styles.visibilityOption,
                { backgroundColor: colors.card, borderColor: visibility === level ? colors.primary : colors.border }
              ]}
              onPress={() => setVisibility(level)}
            >
              <Text style={[styles.visibilityTitle, { color: colors.text }]}>{level.charAt(0).toUpperCase() + level.slice(1)}</Text>
              <Text style={[styles.visibilityDesc, { color: colors.textMuted }]}>
                {level === 'private' && 'Only you can see this.'}
                {level === 'friends' && 'Visible to your connections.'}
                {level === 'public' && 'Visible to everyone in the explore feed.'}
              </Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.card} />
            ) : (
              <Text style={[styles.saveButtonText, { color: colors.card }]}>
                {entryId ? 'Update Entry' : 'Save Entry'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flexGrow: 1, padding: spacing.md },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: spacing.lg },
  textArea: {
    minHeight: 200,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
  label: { fontSize: 16, fontWeight: '600', marginBottom: spacing.sm },
  moodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  moodStar: {
    fontSize: 32,
    color: '#FFC107', // Amber/Gold color for stars
  },
  visibilityOption: {
    borderWidth: 2,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  visibilityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  visibilityDesc: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  saveButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

