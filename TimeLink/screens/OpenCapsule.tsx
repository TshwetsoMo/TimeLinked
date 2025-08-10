// src/screens/OpenCapsuleScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Import our new services, hooks, and types
import { RootStackParamList } from '../navigation/AppNavigation';
import { getCapsule, markCapsuleAsRead } from '../services/capsules';
import { getUserProfile } from '../services/users';
import { useAuth } from '../services/authContext';
import { useTheme } from '../theme/useTheme';
import { spacing } from '../theme/spacing';
import type { Capsule, UserProfile } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'OpenCapsule'>;

export default function OpenCapsuleScreen({ route, navigation }: Props) {
  const { capsuleId } = route.params;
  const { colors } = useTheme();
  const { user } = useAuth(); // Get the currently logged-in user

  // State to hold all the data for the screen
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [sender, setSender] = useState<UserProfile | null>(null);
  const [recipient, setRecipient] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!user) return; // Should not happen if AuthProvider is working

      try {
        // Step 1: Fetch the core capsule data
        const capsuleDoc = await getCapsule(capsuleId);
        if (!capsuleDoc) {
          Alert.alert('Not Found', 'This time capsule could not be found.');
          navigation.goBack();
          return;
        }
        setCapsule(capsuleDoc);

        // Step 2: Fetch the sender and recipient profiles concurrently
        const [senderProfile, recipientProfile] = await Promise.all([
          getUserProfile(capsuleDoc.userId),
          getUserProfile(capsuleDoc.recipientId),
        ]);
        setSender(senderProfile);
        setRecipient(recipientProfile);

        // Step 3: ✅ Smartly mark as read only if the recipient is viewing it
        if (
          user.uid === capsuleDoc.recipientId &&
          !capsuleDoc.isDelivered &&
          capsuleDoc.deliveryDate <= new Date()
        ) {
          await markCapsuleAsRead(capsuleId);
          // Update local state to reflect the change immediately
          setCapsule({ ...capsuleDoc, isDelivered: true });
        }

      } catch (err: any) {
        Alert.alert('Error', err.message || "Could not load capsule.");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [capsuleId, navigation, user]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!capsule) {
    // This state is hit if fetching fails or the doc doesn't exist
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{color: colors.text}}>Could not load capsule.</Text>
      </SafeAreaView>
    );
  }

  const isLocked = capsule.deliveryDate > new Date();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.text }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {capsule.title ?? 'A Message Through Time'}
          </Text>
          
          <View style={[styles.metaRow, { borderBottomColor: colors.border }]}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>FROM</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>{sender?.displayName || 'Unknown'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>TO</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>{recipient?.displayName || 'Unknown'}</Text>
            </View>
          </View>

          <View style={[styles.metaRow, { borderBottomColor: colors.border }]}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>DELIVERS ON</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>
                {capsule.deliveryDate.toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={styles.messageContainer}>
            {isLocked ? (
              <View style={styles.lockedView}>
                <Text style={[styles.lockedIcon, { color: colors.primary }]}>🔒</Text>
                <Text style={[styles.lockedText, { color: colors.textMuted }]}>
                  This message is sealed and will unlock on the delivery date.
                </Text>
              </View>
            ) : (
              <Text style={[styles.message, { color: colors.text }]}>
                {capsule.message}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.buttonText, { color: colors.card }]}>Go Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flexGrow: 1, padding: spacing.md, justifyContent: 'center' },
  card: {
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingVertical: spacing.md,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  messageContainer: {
    paddingVertical: spacing.xl,
    minHeight: 200,
    justifyContent: 'center',
  },
  message: {
    fontSize: 18,
    lineHeight: 28,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  lockedView: {
    alignItems: 'center',
  },
  lockedIcon: {
      fontSize: 48,
  },
  lockedText: {
      fontSize: 16,
      marginTop: spacing.md,
      textAlign: 'center'
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});