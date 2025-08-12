// src/screens/DashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Import hooks, services, types, and navigation
import { useAuth } from '../services/authContext';
import { useTheme } from '../theme/ThemeContext';
import { logoutUser } from '../services/authService'; // Centralized logout function
import { subscribeToMyJournalEntries } from '../services/journal';
import { subscribeToSentCapsules, subscribeToReceivedCapsules } from '../services/capsules';
import { RootStackParamList } from '../navigation/AppNavigation';
import type { JournalEntry, Capsule } from '../types';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

// Reusable ActionButton component for consistent styling within cards.
const ActionButton = ({ title, onPress, colors, type = 'primary' }: any) => (
  <TouchableOpacity
    style={[
      styles.actionButton,
      { 
        backgroundColor: type === 'primary' ? colors.primary : colors.card,
        borderWidth: 1,
        borderColor: type === 'primary' ? colors.primary : colors.border,
      }
    ]}
    onPress={onPress}
  >
    <Text style={[styles.actionButtonText, { color: type === 'primary' ? colors.card : colors.text }]}>
      {title}
    </Text>
  </TouchableOpacity>
);

// Reusable Card component, memoized for performance.
const Card = React.memo(({ title, children, buttonLabel, onPress, colors }: any) => (
  <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.text }]}>
    <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
    {children}
    {buttonLabel && onPress && (
      <View style={{ marginTop: spacing.md }}>
        <ActionButton title={buttonLabel} onPress={onPress} colors={colors} />
      </View>
    )}
  </View>
));

export default function DashboardScreen({ navigation }: Props) {
  // Get theme colors for styling and screen dimensions for responsive layout.
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isLandscape = width > 700;

  // Get the global user state.
  const { user, userProfile } = useAuth();
  
  // Local state to hold data from Firestore subscriptions.
  const [myEntries, setMyEntries] = useState<JournalEntry[]>([]);
  const [sentCapsules, setSentCapsules] = useState<Capsule[]>([]);
  const [receivedCapsules, setReceivedCapsules] = useState<Capsule[]>([]);
  
  // Smarter loading logic: tracks the initial load of each data stream.
  const [loading, setLoading] = useState(true);
  const [journalsLoaded, setJournalsLoaded] = useState(false);
  const [sentLoaded, setSentLoaded] = useState(false);
  const [receivedLoaded, setReceivedLoaded] = useState(false);

  // This effect sets up all necessary real-time listeners when the user logs in.
  useEffect(() => {
    if (!user) return;

    // Subscribes to the user's personal journal entries.
    const unsubEntries = subscribeToMyJournalEntries(user.uid, (data) => {
      setMyEntries(data);
      setJournalsLoaded(true);
    });
    // Subscribes to the capsules sent by the user.
    const unsubSentCaps = subscribeToSentCapsules(user.uid, (data) => {
      setSentCapsules(data);
      setSentLoaded(true);
    });
    // Subscribes to capsules received by the user.
    const unsubReceivedCaps = subscribeToReceivedCapsules(user.uid, (data) => {
      setReceivedCapsules(data);
      setReceivedLoaded(true);
    });

    // The returned function cleans up all listeners when the component unmounts.
    return () => {
      unsubEntries();
      unsubSentCaps();
      unsubReceivedCaps();
    };
  }, [user]);

  // This effect controls the main loading spinner.
  // It only hides the spinner after the first batch of data from ALL listeners has arrived.
  useEffect(() => {
    if (journalsLoaded && sentLoaded && receivedLoaded) {
      setLoading(false);
    }
  }, [journalsLoaded, sentLoaded, receivedLoaded]);

  // Calls the centralized logout function from the auth service.
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  // Pre-calculates values for rendering to keep the return statement clean.
  const upcomingSent = sentCapsules.filter(c => c.deliveryDate > new Date() && !c.isDelivered);
  const nextCapsule = upcomingSent[0] ?? null;
  const newReceivedCount = receivedCapsules.filter(c => !c.isDelivered).length;

  // Handles the conditional navigation for the "Next Sent Capsule" card.
  const handleNextCapsulePress = () => {
    if (nextCapsule) {
      navigation.navigate('CapsulesTimeline');
    } else {
      navigation.navigate('CreateCapsule', {});
    }
  };

  // Shows a loading spinner until the user's profile and initial data are loaded.
  if (loading || !user || !userProfile) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* HEADER: Displays a welcome message and provides access to Profile and Logout. */}
      <View style={[styles.headerRow, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Welcome, {userProfile.displayName || 'User'}!
            </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={{ color: colors.notification, fontWeight: 'bold' }}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      {/* PANES: A two-column layout that adapts to a single column on smaller screens. */}
      <View style={[styles.panes, { flexDirection: isLandscape ? 'row' : 'column' }]}>
        {/* LEFT PANE: Displays a summary of the user's recent journal entries. */}
        <View style={[styles.leftPane, { borderColor: colors.border, borderRightWidth: isLandscape ? 1 : 0 }]}>
          <FlatList
            data={myEntries.slice(0, 10)} // Only show the 10 most recent entries.
            keyExtractor={e => e.id}
            ListHeaderComponent={<Text style={[styles.paneTitle, {color: colors.text}]}>My Recent Entries</Text>}
            contentContainerStyle={{padding: spacing.sm}}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.listItem, {backgroundColor: colors.card, shadowColor: colors.text}]} onPress={() => navigation.navigate('ReadJournal', { entryId: item.id })}>
                <Text numberOfLines={2} style={[styles.listItemText, { color: colors.text }]}>{item.content}</Text>
                <Text style={[styles.listItemDate, { color: colors.textMuted }]}>{item.createdAt.toLocaleDateString()}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={[styles.placeholder, {color: colors.textMuted}]}>No journal entries yet.</Text>}
          />
          <View style={{ padding: spacing.md, borderTopWidth: 1, borderColor: colors.border }}>
            <ActionButton title="Write a New Entry" onPress={() => navigation.navigate('CreateJournal', {})} colors={colors} />
          </View>
        </View>

        {/* RIGHT PANE: Contains cards that serve as navigation hubs to all other features. */}
        <View style={styles.rightPane}>
          <ScrollView contentContainerStyle={{ padding: spacing.md }}>
            <Card title="Your Inbox" buttonLabel="View Inbox" onPress={() => navigation.navigate('Inbox')} colors={colors}>
              <Text style={{ color: colors.text, fontSize: 16 }}>
                You have <Text style={{fontWeight: 'bold'}}>{newReceivedCount}</Text> new capsule(s) to open.
              </Text>
            </Card>

            <Card
              title="Next Sent Capsule"
              buttonLabel={nextCapsule ? 'View Sent Timeline' : 'Schedule a Capsule'}
              onPress={handleNextCapsulePress}
              colors={colors}
            >
              <Text style={{ color: colors.text }}>
                {nextCapsule ? `${nextCapsule.title || 'Untitled'} – ${nextCapsule.deliveryDate.toLocaleDateString()}` : 'No upcoming capsules scheduled.'}
              </Text>
            </Card>

            <Card title="Explore & Connect" colors={colors}>
                <View style={{gap: spacing.sm}}>
                    <ActionButton title="Find Friends" onPress={() => navigation.navigate('SearchUsers')} colors={colors} type="secondary" />
                    <ActionButton title="My Connections" onPress={() => navigation.navigate('FriendsList', {})} colors={colors} type="secondary" />
                    <ActionButton title="Friends Feed" onPress={() => navigation.navigate('FriendsFeed')} colors={colors} type="secondary" />
                    <ActionButton title="Public Feed" onPress={() => navigation.navigate('PublicFeed')} colors={colors} type="secondary" />
                </View>
            </Card>

            <Card title="My Stats" colors={colors}>
              <Text style={{ color: colors.text }}>{myEntries.length} total journal entries.</Text>
              <Text style={{ color: colors.text, marginTop: spacing.xs }}>{sentCapsules.length} total capsules sent.</Text>
            </Card>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

// All styles are themed and use consistent spacing.
const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  panes: { flex: 1, flexDirection: 'row' },
  leftPane: { flex: 2, borderRightWidth: 1 },
  rightPane: { flex: 3 },
  paneTitle: { fontSize: 18, fontWeight: '600', paddingHorizontal: spacing.sm, marginBottom: spacing.sm },
  listItem: { padding: spacing.md, borderRadius: 8, marginBottom: spacing.sm, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  listItemText: { fontSize: 14, lineHeight: 20 },
  listItemDate: { fontSize: 12, opacity: 0.7, marginTop: spacing.sm },
  placeholder: { fontStyle: 'italic', textAlign: 'center', padding: spacing.md },
  card: { padding: spacing.md, marginBottom: spacing.md, borderRadius: 12, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: spacing.sm },
  actionButton: { borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  actionButtonText: { fontWeight: 'bold', fontSize: 16 },
});
