// src/screens/CreateCapsule.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigation';
import { auth } from '../services/firebase';
import {
  createCapsule,
  updateCapsule,
  getCapsule,
} from '../services/capsules';
import type { Capsule } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateCapsule'>;

export default function CreateCapsuleScreen({ route, navigation }: Props) {
  const user = auth.currentUser!;
  const capsuleId = route.params?.capsuleId;

  const [title, setTitle] = useState('');
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // If editing, load existing capsule
  useEffect(() => {
    if (capsuleId) {
      setLoading(true);
      getCapsule(capsuleId)
        .then((c: Capsule | null) => {
          if (c) {
            setTitle(c.title ?? '');
            setRecipient(c.recipient ?? '');
            setMessage(c.message);
            setDate(c.deliveryDate);
          } else {
            Alert.alert('Error', 'Capsule not found');
            navigation.goBack();
          }
        })
        .catch(err => {
          Alert.alert('Error', err.message);
          navigation.goBack();
        })
        .finally(() => setLoading(false));
    }
  }, [capsuleId, navigation]);

  const onChange = (event: any, selected?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selected) setDate(selected);
  };

  const handleSave = () => {
    if (!message.trim()) {
      return Alert.alert('Validation', 'Please enter a message before saving.');
    }

    setLoading(true);
    const op = capsuleId
      ? updateCapsule(capsuleId, { title, recipient, message, deliveryDate: date })
      : createCapsule(user.uid, message, date, title || undefined, recipient || undefined);

    op
      .then(() => {
        Alert.alert(
          'Success',
          capsuleId ? 'Capsule updated!' : 'Time capsule scheduled!'
        );
        navigation.goBack();
      })
      .catch(err => Alert.alert('Error', err.message))
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.heading}>
          {capsuleId ? 'Edit Time Capsule' : 'New Time Capsule'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Title (optional)"
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={styles.input}
          placeholder="Recipient email (optional)"
          keyboardType="email-address"
          autoCapitalize="none"
          value={recipient}
          onChangeText={setRecipient}
        />

        <TouchableOpacity onPress={() => setShowPicker(true)}>
          <Text style={styles.dateText}>
            Delivery: {date.toLocaleDateString()} {date.toLocaleTimeString()}
          </Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={date}
            mode="datetime"
            display="default"
            onChange={onChange}
          />
        )}

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Write your message..."
          multiline
          value={message}
          onChangeText={setMessage}
        />

        <Button
          title={capsuleId ? 'Update Capsule' : 'Schedule Capsule'}
          onPress={handleSave}
          disabled={loading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  dateText: {
    fontSize: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 12,
    color: '#333',
  },
});