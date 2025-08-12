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

// Import services, hooks, and types
import { RootStackParamList } from '../navigation/AppNavigation';
import { useAuth } from '../services/authContext';
import { useTheme } from '../theme/ThemeContext';
import { createJournalEntry, updateJournalEntry, getJournalEntry } from '../services/journal';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateJournal'>;

// Define a TypeScript type for the visibility options for type safety.
type Visibility = 'private' | 'friends' | 'public';

export default function CreateJournalScreen({ route, navigation }: Props) {
  // Get global user state and current theme colors.
  const { user } = useAuth();
  const { colors } = useTheme();

  // Get the entryId from navigation params. It will be a string if editing, otherwise undefined.
  const { entryId } = route.params || {};

  // Local state for the form's controlled components.
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<number>(3);
  const [visibility, setVisibility] = useState<Visibility>('private'); // Default to private for user safety.
  
  // Separate loading states for clarity: `loading` for the initial fetch, `saving` for submission.
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // This effect handles "Edit Mode". It only runs if an `entryId` is passed.
  useEffect(() => {
    const loadEntryForEditing = async () => {
      // If we are in edit mode...
      if (entryId) {
        setLoading(true); // Show a loading spinner.
        try {
          // Fetch the specific journal entry from Firestore.
          const entry = await getJournalEntry(entryId);
          if (entry) {
            // Populate the form's state with the fetched data.
            setContent(entry.content);
            setMood(entry.mood || 3);
            setVisibility(entry.visibility);
          } else {
            // Handle the case where the entry might have been deleted.
            Alert.alert('Error', 'Journal entry not found.');
            navigation.goBack();
          }
        } catch (err: any) {
          Alert.alert('Error', err.message);
          navigation.goBack();
        } finally {
          setLoading(false); // Hide the spinner.
        }
      }
    };
    loadEntryForEditing();
  }, [entryId, navigation]); // This effect re-runs only if `entryId` changes.

  // Handles the submission of the form.
  const handleSave = async () => {
    if (!user) return; // Safety check.
    // Client-side validation.
    if (!content.trim()) {
      return Alert.alert('Empty Entry', 'Please write something in your journal before saving.');
    }

    setSaving(true);
    try {
      // Determine whether to update an existing entry or create a new one.
      if (entryId) {
        // Calls the centralized service to update the document in Firestore.
        await updateJournalEntry(entryId, { content, mood, visibility });
        Alert.alert('Success', 'Your entry has been updated.');
      } else {
        // Calls the centralized service to create a new document in Firestore.
        await createJournalEntry(user.uid, content, visibility, mood);
      }
      // On success, navigate the user back to the previous screen.
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  // Renders a loading spinner during the initial data fetch in "Edit Mode".
  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* KeyboardAvoidingView prevents the keyboard from covering the input fields. */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={[styles.header, { color: colors.text }]}>
            {entryId ? 'Edit Your Entry' : 'How are you today?'}
          </Text>

          {/* The main text area for the journal content. */}
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="Write your thoughts, memories, and feelings..."
            placeholderTextColor={colors.textMuted}
            multiline
            value={content}
            onChangeText={setContent}
          />

          {/* A custom component for selecting a mood from 1 to 5. */}
          <Text style={[styles.label, { color: colors.text }]}>Your Mood</Text>
          <View style={[styles.moodSelector, { backgroundColor: colors.card }]}>
            {[1, 2, 3, 4, 5].map((level) => (
              <TouchableOpacity key={level} onPress={() => setMood(level)}>
                <Text style={[styles.moodStar, { opacity: mood >= level ? 1 : 0.3 }]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* The crucial UI for setting the post's visibility, enabling social features. */}
          <Text style={[styles.label, { color: colors.text }]}>Who can see this?</Text>
          {(['private', 'friends', 'public'] as Visibility[]).map(level => (
            <TouchableOpacity
              key={level}
              style={[
                styles.visibilityOption,
                { 
                  backgroundColor: colors.card, 
                  borderColor: visibility === level ? colors.primary : colors.border 
                }
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
          
          {/* The main submission button. Shows a loading spinner when saving. */}
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

// All styles are themed and use consistent spacing.
const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flexGrow: 1, padding: spacing.md, paddingBottom: 50 },
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
    borderRadius: 8,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  moodStar: {
    fontSize: 32,
    color: '#FFC107',
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

