// src/screens/DashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions, // Keep this for potential future responsive logic
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Import hooks, services, types, and navigation
import { useAuth } from '../services/authContext';
import { useTheme } from '../theme/ThemeContext';
import { logoutUser } from '../services/authService'; 
import { subscribeToMyJournalEntries } from '../services/journal';
import { subscribeToSentCapsules, subscribeToReceivedCapsules } from '../services/capsules';
import { subscribeToIncomingFriendRequests } from '../services/users';
import { RootStackParamList } from '../navigation/AppNavigation';
import type { Capsule } from '../types';
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
  const { colors } = useTheme();
  const { user, userProfile } = useAuth();
  
  // State for all data subscriptions needed on this screen.
  const [journalCount, setJournalCount] = useState(0);
  const [sentCapsules, setSentCapsules] = useState<Capsule[]>([]);
  const [receivedCapsules, setReceivedCapsules] = useState<Capsule[]>([]);
  const [incomingRequestCount, setIncomingRequestCount] = useState(0);
  
  // Robust loading logic that waits for all initial data to be fetched.
  const [loading, setLoading] = useState(true);
  const [journalsLoaded, setJournalsLoaded] = useState(false);
  const [sentLoaded, setSentLoaded] = useState(false);
  const [receivedLoaded, setReceivedLoaded] = useState(false);
  const [requestsLoaded, setRequestsLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      navigation.replace('Welcome');
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    const unsubEntries = subscribeToMyJournalEntries(user.uid, (data) => {
      setJournalCount(data.length);
      setJournalsLoaded(true);
    });
    const unsubSentCaps = subscribeToSentCapsules(user.uid, (data) => {
      setSentCapsules(data);
      setSentLoaded(true);
    });
    const unsubReceivedCaps = subscribeToReceivedCapsules(user.uid, (data) => {
      setReceivedCapsules(data);
      setReceivedLoaded(true);
    });
    const unsubRequests = subscribeToIncomingFriendRequests(user.uid, (requests) => {
      setIncomingRequestCount(requests.length);
      setRequestsLoaded(true);
    });

    return () => {
      unsubEntries();
      unsubSentCaps();
      unsubReceivedCaps();
      unsubRequests();
    };
  }, [user]);

  useEffect(() => {
    if (journalsLoaded && sentLoaded && receivedLoaded && requestsLoaded) {
      setLoading(false);
    }
  }, [journalsLoaded, sentLoaded, receivedLoaded, requestsLoaded]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const nextCapsule = sentCapsules.find(c => c.deliveryDate > new Date());
  const newReceivedCount = receivedCapsules.filter(c => !c.isDelivered).length;

  if (loading || !user || !userProfile) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
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
      
      {/* The main layout is now a single ScrollView. */}
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* The "My Stats" card is now at the top. */}
        <Card title="My Stats" colors={colors}>
          <Text style={{ color: colors.text }}>{journalCount} total journal entries.</Text>
          <Text style={{ color: colors.text, marginTop: spacing.xs }}>{sentCapsules.length} total capsules sent.</Text>
        </Card>

        <Card title="Your Inbox" buttonLabel="View Inbox" onPress={() => navigation.navigate('Inbox')} colors={colors}>
          <Text style={{ color: colors.text, fontSize: 16 }}>
            You have <Text style={{fontWeight: 'bold'}}>{newReceivedCount}</Text> new capsule(s) to open.
          </Text>
        </Card>

        {/* The dedicated "My Journal" card. */}
        <Card title="My Journal" colors={colors}>
            <Text style={{ color: colors.text, marginBottom: spacing.md }}>
              Keep track of your thoughts and memories.
            </Text>
            <View style={{gap: spacing.sm}}>
                <ActionButton title="Write a New Entry" onPress={() => navigation.navigate('CreateJournal', {})} colors={colors} />
                <ActionButton title="View All Entries" onPress={() => navigation.navigate('Journal')} colors={colors} type="secondary" />
            </View>
        </Card>
        
        <Card title="My Time Capsules" colors={colors}>
          <Text style={{ color: colors.text, marginBottom: spacing.md }}>
            {nextCapsule
              ? `Next capsule delivers on ${nextCapsule.deliveryDate.toLocaleDateString()}.`
              : 'You have no upcoming capsules scheduled.'
            }
          </Text>
          <View style={{gap: spacing.sm}}>
              <ActionButton title="Schedule a New Capsule" onPress={() => navigation.navigate('CreateCapsule', {})} colors={colors} />
              <ActionButton title="View Sent Timeline" onPress={() => navigation.navigate('CapsulesTimeline')} colors={colors} type="secondary" />
          </View>
        </Card>

        <Card title="Explore & Connect" colors={colors}>
            <View style={{gap: spacing.sm}}>
                {/* The new "Friend Requests" button, with its notification badge. */}
                <TouchableOpacity 
                    style={[styles.notificationButton, {backgroundColor: colors.primary}]} 
                    onPress={() => navigation.navigate('Notifications')}
                >
                    <Text style={[styles.actionButtonText, { color: colors.card }]}>Friend Requests</Text>
                    {incomingRequestCount > 0 && (
                        <View style={[styles.badge, {backgroundColor: colors.notification, borderColor: colors.card}]}>
                            <Text style={styles.badgeText}>{incomingRequestCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <ActionButton title="Find Friends" onPress={() => navigation.navigate('SearchUsers')} colors={colors} type="secondary" />
                <ActionButton title="My Connections" onPress={() => navigation.navigate('FriendsList', {})} colors={colors} type="secondary" />
                <ActionButton title="Friends Feed" onPress={() => navigation.navigate('FriendsFeed')} colors={colors} type="secondary" />
                <ActionButton title="Public Feed" onPress={() => navigation.navigate('PublicFeed')} colors={colors} type="secondary" />
            </View>
        </Card>
        
      </ScrollView>
    </SafeAreaView>
  );
}

// The stylesheet is simplified and includes new styles for the notification button and badge.
const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  card: { padding: spacing.md, marginBottom: spacing.md, borderRadius: 12, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: spacing.sm },
  actionButton: { borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  actionButtonText: { fontWeight: 'bold', fontSize: 16 },
  notificationButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});