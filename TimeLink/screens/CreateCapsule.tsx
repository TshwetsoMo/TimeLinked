// src/screens/CreateCapsuleScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Import our new services, hooks, and types
import { RootStackParamList } from '../navigation/AppNavigation';
import { useAuth } from '../services/authContext';
import { useTheme } from '../theme/ThemeContext';
import { createCapsule, updateCapsule, getCapsule } from '../services/capsules';
import { getUserProfile } from '../services/users';
import type { UserProfile } from '../types';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateCapsule'>;

export default function CreateCapsuleScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  const { colors } = useTheme();
  
  const { capsuleId, selectedRecipient } = route.params || {};

  // State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [date, setDate] = useState(new Date(new Date().setHours(new Date().getHours() + 1)));
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recipient, setRecipient] = useState<UserProfile | null>(null);

  // Effect to handle when a recipient is selected from the FriendsListScreen
  useEffect(() => {
    if (selectedRecipient) {
      setRecipient(selectedRecipient);
    }
  }, [selectedRecipient]);

  // Effect for "Edit" mode: load existing capsule data
  useEffect(() => {
    const loadCapsuleForEditing = async () => {
      if (capsuleId) {
        setLoading(true);
        try {
          const capsule = await getCapsule(capsuleId);
          if (capsule) {
            setTitle(capsule.title || '');
            setMessage(capsule.message);
            setDate(capsule.deliveryDate);
            const recipientProfile = await getUserProfile(capsule.recipientId);
            setRecipient(recipientProfile);
          } else {
            Alert.alert('Error', 'Capsule not found.');
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
    loadCapsuleForEditing();
  }, [capsuleId, navigation]);

  const onDateChange = (_event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowPicker(Platform.OS === 'ios');
    if (currentDate < new Date()) {
      Alert.alert("Invalid Date", "Time capsules must be set for a future date and time.");
      return;
    }
    setDate(currentDate);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!recipient) {
      return Alert.alert('Recipient Required', 'Please select a friend to send this capsule to.');
    }
    if (!message.trim()) {
      return Alert.alert('Message Required', 'Please write a message for your capsule.');
    }

    setSaving(true);
    try {
      if (capsuleId) {
        await updateCapsule(capsuleId, {
          title: title.trim(),
          recipientId: recipient.id,
          message: message.trim(),
          deliveryDate: date,
        });
        Alert.alert('Success', 'Your time capsule has been updated!');
      } else {
        await createCapsule(user.uid, recipient.id, message.trim(), date, title.trim());
        Alert.alert('Success', 'Your time capsule has been scheduled!');
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
            {capsuleId ? 'Edit Time Capsule' : 'New Time Capsule'}
          </Text>

          <Text style={[styles.label, { color: colors.text }]}>To:</Text>
          {/* This is the navigation trigger */}
          <TouchableOpacity
            style={[styles.pickerButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('FriendsList', { asPicker: true })}
          >
            <Text style={[styles.pickerText, { color: recipient ? colors.text : colors.textMuted }]}>
              {recipient ? recipient.displayName : 'Select a Recipient...'}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.label, { color: colors.text }]}>Title (Optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="e.g., A Memory from 2025"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[styles.label, { color: colors.text }]}>Delivery Date</Text>
          <TouchableOpacity
            style={[styles.pickerButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowPicker(true)}
          >
            <Text style={[styles.pickerText, { color: colors.text }]}>
              {date.toLocaleString()}
            </Text>
          </TouchableOpacity>
          
          {showPicker && (
            <DateTimePicker value={date} mode="datetime" display="spinner" onChange={onDateChange} />
          )}

          <Text style={[styles.label, { color: colors.text }]}>Message</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="Write your message to the future..."
            placeholderTextColor={colors.textMuted}
            multiline
            value={message}
            onChangeText={setMessage}
          />

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.card} />
            ) : (
              <Text style={[styles.saveButtonText, { color: colors.card }]}>
                {capsuleId ? 'Update Capsule' : 'Schedule Capsule'}
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
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: spacing.lg, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: spacing.sm, marginTop: spacing.md },
  input: { height: 50, borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, fontSize: 16 },
  textArea: { height: 150, borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, textAlignVertical: 'top' },
  pickerButton: { height: 50, borderWidth: 1, borderRadius: 8, justifyContent: 'center', paddingHorizontal: 16 },
  pickerText: { fontSize: 16 },
  saveButton: { height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg },
  saveButtonText: { fontSize: 18, fontWeight: 'bold' },
});