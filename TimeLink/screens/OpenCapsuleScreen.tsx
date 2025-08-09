// src/screens/OpenCapsule.tsx
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Button,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigation';
import { getCapsule, markDelivered } from '../services/capsules';
import type { Capsule } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'OpenCapsule'>;

export default function OpenCapsuleScreen({ route, navigation }: Props) {
  const { capsuleId } = route.params;
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAndDeliver() {
      try {
        const doc = await getCapsule(capsuleId);
        if (!doc) {
          Alert.alert('Not Found', 'This capsule no longer exists.');
          navigation.goBack();
          return;
        }
        setCapsule(doc);

        // If it's now unlocked and not yet marked delivered, do so
        if (!doc.isDelivered && doc.deliveryDate <= new Date()) {
          await markDelivered(capsuleId);
          setCapsule({ ...doc, isDelivered: true });
        }
      } catch (err: any) {
        Alert.alert('Error', err.message);
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    }
    fetchAndDeliver();
  }, [capsuleId, navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!capsule) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>{capsule.title ?? 'Untitled Capsule'}</Text>

        <Text style={styles.meta}>
          Created: {capsule.createdAt.toLocaleDateString()}{' '}
          {capsule.createdAt.toLocaleTimeString()}
        </Text>

        <Text style={styles.meta}>
          Deliver: {capsule.deliveryDate.toLocaleDateString()}{' '}
          {capsule.deliveryDate.toLocaleTimeString()}
        </Text>

        {capsule.recipient ? (
          <Text style={styles.meta}>To: {capsule.recipient}</Text>
        ) : null}

        <Text style={styles.status}>
          Status:{' '}
          {capsule.isDelivered
            ? '🔓 Delivered'
            : capsule.deliveryDate > new Date()
            ? '🔒 Pending'
            : '⏳ Unlocking...'}
        </Text>

        <View style={styles.messageBox}>
          <Text style={styles.message}>{capsule.message}</Text>
        </View>

        <Button title="Back to Timeline" onPress={() => navigation.goBack()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  meta: { fontSize: 14, color: '#555', marginBottom: 4 },
  status: { fontSize: 16, fontWeight: '600', marginVertical: 8, color: '#333' },
  messageBox: {
    flex: 1,
    backgroundColor: '#fafafa',
    padding: 16,
    marginVertical: 16,
    borderRadius: 8,
  },
  message: { fontSize: 16, lineHeight: 22 },
});