// src/screens/NotificationsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Import services, hooks, and types
import { RootStackParamList } from '../navigation/AppNavigation';
import { useAuth } from '../services/authContext';
import { useTheme } from '../theme/ThemeContext';
import { subscribeToIncomingFriendRequests, acceptFriendRequest, rejectFriendRequest } from '../services/users';
import type { UserProfile } from '../types';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>; // Add 'Notifications' to your RootStackParamList

export default function NotificationsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { colors } = useTheme();

  const [requests, setRequests] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  // State to track which specific request is being handled for per-item loading UI.
  const [handlingRequestId, setHandlingRequestId] = useState<string | null>(null);

  // This effect subscribes to the user's incoming friend requests in real-time.
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const unsubscribe = subscribeToIncomingFriendRequests(user.uid, (fetchedRequests) => {
      setRequests(fetchedRequests);
      setLoading(false);
    });

    // Cleanup the subscription on unmount.
    return () => unsubscribe();
  }, [user]);

  // Handles accepting a friend request.
  const handleAccept = async (sender: UserProfile) => {
    if (!user) return;
    setHandlingRequestId(sender.id);
    try {
      // Calls the centralized service which creates the connection and deletes the requests.
      await acceptFriendRequest(user.uid, sender.id);
      // No success alert is needed; the real-time listener will remove the item, which IS the success feedback.
    } catch (error: any) {
      Alert.alert("Error", "Failed to accept the request. Please try again.");
    } finally {
      setHandlingRequestId(null);
    }
  };

  // Handles rejecting a friend request.
  const handleReject = async (sender: UserProfile) => {
    if (!user) return;
    setHandlingRequestId(sender.id);
    try {
      // Calls the centralized service which deletes the pending request documents.
      await rejectFriendRequest(user.uid, sender.id);
    } catch (error: any) {
      Alert.alert("Error", "Failed to reject the request. Please try again.");
    } finally {
      setHandlingRequestId(null);
    }
  };

  // Defines how to render a single request card in the list.
  const renderRequest = ({ item }: { item: UserProfile }) => {
    const isHandling = handlingRequestId === item.id;
    return (
      <View style={[styles.requestCard, { backgroundColor: colors.card, shadowColor: colors.text }]}>
        <Image
          source={item.photoURL ? { uri: item.photoURL } : require('../assets/logo.png')}
          style={styles.profileImage}
        />
        <View style={styles.requestInfo}>
          <Text style={[styles.requestText, { color: colors.text }]}>
            <Text style={{ fontWeight: 'bold' }}>{item.displayName}</Text> sent you a friend request.
          </Text>
        </View>
        <View style={styles.actionContainer}>
          {isHandling ? (
            <ActivityIndicator />
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => handleAccept(item)}
              >
                <Text style={[styles.actionButtonText, { color: colors.card }]}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.border }]}
                onPress={() => handleReject(item)}
              >
                <Text style={[styles.actionButtonText, { color: colors.text }]}>Reject</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
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
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequest}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <Text style={[styles.header, { color: colors.text }]}>Notifications</Text>
        }
        ListEmptyComponent={
          <View style={styles.placeholderContainer}>
            <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
              You have no pending friend requests.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  listContainer: { padding: spacing.md },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: spacing.md },
  requestCard: {
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.md,
  },
  requestInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  requestText: {
    fontSize: 16,
    lineHeight: 22,
    flex: 1,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  placeholderContainer: {
    marginTop: 100,
    alignItems: 'center',
    padding: spacing.lg,
  },
  placeholderText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
});