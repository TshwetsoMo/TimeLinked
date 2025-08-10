// src/screens/Dashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Button,
  useWindowDimensions,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
// Hooks and services for the new architecture
import { useAuth } from '../services/authContext';
import { useTheme } from '../theme/useTheme';
import { logoutUser } from '../services/authService';
import { subscribeToMyJournalEntries } from '../services/journal';
import { subscribeToSentCapsules, subscribeToReceivedCapsules } from '../services/capsules';
// Types and navigation
import { RootStackParamList } from '../navigation/AppNavigation';
import type { JournalEntry, Capsule } from '../types';
import { spacing } from '../theme/spacing';


type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export default function DashboardScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isLandscape = width > 700; // Use a more robust check for landscape

  // ✅ Use the new Auth Context
  const { user, userProfile } = useAuth();

  // State for the different data streams
  const [myEntries, setMyEntries] = useState<JournalEntry[]>([]);
  const [sentCapsules, setSentCapsules] = useState<Capsule[]>([]);
  const [receivedCapsules, setReceivedCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Abort if the user is not loaded yet
    if (!user) return;

    setLoading(true);

    // Subscribe to the user's own journal entries
    const unsubEntries = subscribeToMyJournalEntries(user.uid, setMyEntries);
    
    // Subscribe to capsules the user has sent
    const unsubSentCaps = subscribeToSentCapsules(user.uid, setSentCapsules);

    // Subscribe to capsules the user has received (that are unlocked)
    const unsubReceivedCaps = subscribeToReceivedCapsules(user.uid, setReceivedCapsules);

    setLoading(false);

    // Unsubscribe from all listeners on cleanup
    return () => {
      unsubEntries();
      unsubSentCaps();
      unsubReceivedCaps();
    };
  }, [user]);

  // Handle logout using the auth service
  const handleLogout = async () => {
    try {
      await logoutUser();
      // The AuthProvider will handle navigation automatically
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  // Memoized card component for performance
  const Card = React.memo(({ title, children, buttonLabel, onPress }: {
    title: string;
    children?: React.ReactNode;
    buttonLabel?: string;
    onPress?: () => void;
  }) => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
      {children}
      {buttonLabel && onPress && (
        <View style={{ marginTop: spacing.sm }}>
          <Button title={buttonLabel} onPress={onPress} color={colors.primary} />
        </View>
      )}
    </View>
  ));
  
  // Guard clause for loading user data
  if (!user || !userProfile) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  // Calculate summaries
  const upcomingSent = sentCapsules.filter(c => c.deliveryDate > new Date() && !c.isDelivered);
  const nextCapsule = upcomingSent[0] ?? null;
  const newReceivedCount = receivedCapsules.filter(c => !c.isDelivered).length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Welcome, {userProfile.displayName || 'User'}
        </Text>
        <View style={styles.headerButtons}>
          <Button title="Profile" onPress={() => navigation.navigate('Profile')} color={colors.primary} />
          <View style={{ width: spacing.sm }} />
          <Button title="Logout" onPress={handleLogout} color={colors.accent} />
        </View>
      </View>
      
      <View style={[ styles.panes, { flexDirection: isLandscape ? 'row' : 'column' }]}>
        {/* LEFT PANE: My Journal Entries */}
        <View style={[ styles.leftPane, { borderColor: colors.border, borderRightWidth: isLandscape ? 1 : 0, borderBottomWidth: isLandscape ? 0 : 1, width: isLandscape ? '40%' : '100%' }]}>
          <FlatList
            data={myEntries}
            keyExtractor={e => e.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.listItem} onPress={() => navigation.navigate('ReadJournal', { entryId: item.id })}>
                <Text numberOfLines={1} style={[styles.listItemText, { color: colors.text }]}>{item.content}</Text>
              </TouchableOpacity>
            )}
            ListHeaderComponent={<Text style={styles.paneTitle}>My Recent Entries</Text>}
            ListEmptyComponent={<Text style={styles.placeholder}>You haven't written any journal entries yet.</Text>}
          />
          <View style={{ padding: spacing.sm }}>
            <Button title="Write a New Entry" onPress={() => navigation.navigate('CreateJournal', {})} />
          </View>
        </View>

        {/* RIGHT PANE: Overview and Actions */}
        <View style={[styles.rightPane, { width: isLandscape ? '60%' : '100%' }]}>
          <ScrollView contentContainerStyle={{ padding: spacing.md }}>
            
            {/* ✅ NEW: Inbox Card */}
            <Card
              title="Your Inbox"
              buttonLabel="View Inbox"
              onPress={() => { /* Navigate to a new 'InboxScreen' */ }}
            >
              <Text style={{ color: colors.text, fontSize: 16 }}>
                You have <Text style={{fontWeight: 'bold'}}>{newReceivedCount}</Text> new capsule(s) ready to open.
              </Text>
            </Card>

            <Card
              title="Next Sent Capsule"
              buttonLabel={nextCapsule ? 'View Timeline' : 'Schedule One'}
              onPress={() => navigation.navigate(nextCapsule ? 'CapsulesTimeline' : 'CreateCapsule')}
            >
              <Text style={{ color: colors.text }}>
                {nextCapsule ? `${nextCapsule.title ?? 'Untitled'} – ${nextCapsule.deliveryDate.toLocaleDateString()}` : 'No upcoming capsules scheduled.'}
              </Text>
            </Card>

            {/* ✅ NEW: Social Actions Card */}
            <Card title="Explore & Connect">
              <Button title="Find Friends" onPress={() => { /* Navigate to a 'SearchUsersScreen' */ }} />
              <View style={{ height: spacing.sm }} />
              <Button title="Friends Feed" onPress={() => { /* Navigate to a 'FriendsFeedScreen' */ }} />
              <View style={{ height: spacing.sm }} />
              <Button title="Public Feed" onPress={() => { /* Navigate to a 'PublicFeedScreen' */ }} />
            </Card>

            <Card title="Summary">
              <Text style={{ color: colors.text }}>{myEntries.length} total journal entries written.</Text>
              <Text style={{ color: colors.text }}>{sentCapsules.length} total capsules sent.</Text>
            </Card>
            
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, backgroundColor: '#fff', borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  panes: { flex: 1, flexDirection: 'row' },
  leftPane: { flex: 2, borderRightWidth: 1 },
  rightPane: { flex: 3 },
  paneTitle: { fontSize: 18, fontWeight: '600', paddingHorizontal: spacing.sm, paddingTop: spacing.md, paddingBottom: spacing.sm },
  listItem: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: '#eee' },
  listItemText: { fontSize: 16 },
  placeholder: { fontStyle: 'italic', textAlign: 'center', padding: spacing.md, color: '#777' },
  card: { padding: spacing.md, marginHorizontal: spacing.md, marginBottom: spacing.md, borderRadius: 8, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: spacing.sm },
});
