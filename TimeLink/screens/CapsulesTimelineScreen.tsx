// src/screens/CapsulesTimeline.tsx
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  subscribeToCapsules,
  deleteCapsule,
} from '../services/capsules'; // ✅ Make sure this is implemented
import { auth } from '../services/firebase';
import type { Capsule } from '../types';
import type { RootStackParamList } from '../navigation/AppNavigation';

type Props = NativeStackScreenProps<RootStackParamList, 'CapsulesTimeline'>;

export default function CapsulesTimelineScreen({ navigation }: Props) {
  const user = auth.currentUser!;
  const [capsules, setCapsules] = useState<Capsule[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToCapsules(user.uid, (entries) => {
      setCapsules(entries);
    });
    return unsubscribe;
  }, [user.uid]);

  const now = new Date();
  const upcoming = capsules
    .filter(c => c.deliveryDate > now)
    .sort((a, b) => a.deliveryDate.getTime() - b.deliveryDate.getTime());

  const past = capsules
    .filter(c => c.deliveryDate <= now)
    .sort((a, b) => b.deliveryDate.getTime() - a.deliveryDate.getTime());

  const renderCapsule = ({ item }: { item: Capsule }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title ?? 'Untitled'}</Text>
      <Text style={styles.meta}>To: {item.recipient ?? 'No recipient'}</Text>
      <Text style={styles.meta}>
        Delivery: {item.deliveryDate.toLocaleString()}
      </Text>
      {item.deliveryDate <= now && (
        <Text style={styles.unlocked}>🔓 Delivered</Text>
      )}

      <View style={styles.actionRow}>
        <Button
          title="Edit"
          onPress={() =>
            navigation.navigate('CreateCapsule', { capsuleId: item.id })
          }
        />
        <Button
          title="Delete"
          color="#c00"
          onPress={() =>
            Alert.alert(
              'Delete Capsule',
              'Are you sure you want to delete this capsule?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => deleteCapsule(item.id),
                },
              ]
            )
          }
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.header}>Upcoming Capsules</Text>
      <FlatList
        data={upcoming}
        keyExtractor={c => c.id}
        renderItem={renderCapsule}
        ListEmptyComponent={
          <Text style={styles.empty}>No upcoming capsules.</Text>
        }
      />

      <Text style={styles.header}>Past Capsules</Text>
      <FlatList
        data={past}
        keyExtractor={c => c.id}
        renderItem={renderCapsule}
        ListEmptyComponent={
          <Text style={styles.empty}>No past capsules yet.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', marginVertical: 12 },
  card: {
    backgroundColor: '#fafafa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  title: { fontSize: 16, fontWeight: 'bold' },
  meta: { fontSize: 14, color: '#555', marginTop: 4 },
  unlocked: { color: '#0a0', marginTop: 6 },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  empty: { fontStyle: 'italic', color: '#777', padding: 8 },
});