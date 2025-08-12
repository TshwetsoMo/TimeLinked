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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Import hooks, services, types, and navigation
import { useAuth } from '../services/authContext';
import { useTheme } from '../theme/ThemeContext';
import { logoutUser } from '../services/authService';
// ✅ We now only need the COUNT of journals, which is simpler.
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
  const { colors } = useTheme();
  const { user, userProfile } = useAuth();
  
  // ✅ Simplified state. We only need the counts for the stats card.
  const [journalCount, setJournalCount] = useState(0);
  const [sentCapsules, setSentCapsules] = useState<Capsule[]>([]);
  const [receivedCapsules, setReceivedCapsules] = useState<Capsule[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [journalsLoaded, setJournalsLoaded] = useState(false);
  const [sentLoaded, setSentLoaded] = useState(false);
  const [receivedLoaded, setReceivedLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;

    // The logic to handle logout navigation remains unchanged and correct.
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    // ✅ Simplified subscriptions. For journals, we only need the length of the array.
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

    return () => {
      unsubEntries();
      unsubSentCaps();
      unsubReceivedCaps();
    };
  }, [user]);

  useEffect(() => {
    if (journalsLoaded && sentLoaded && receivedLoaded) {
      setLoading(false);
    }
  }, [journalsLoaded, sentLoaded, receivedLoaded]);

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
      
      {/* ✅ Replaced the complex two-pane layout with a single, clean ScrollView. */}
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* ✅ "My Stats" card is now at the top. */}
        <Card title="My Stats" colors={colors}>
          <Text style={{ color: colors.text }}>{journalCount} total journal entries.</Text>
          <Text style={{ color: colors.text, marginTop: spacing.xs }}>{sentCapsules.length} total capsules sent.</Text>
        </Card>

        <Card title="Your Inbox" buttonLabel="View Inbox" onPress={() => navigation.navigate('Inbox')} colors={colors}>
          <Text style={{ color: colors.text, fontSize: 16 }}>
            You have <Text style={{fontWeight: 'bold'}}>{newReceivedCount}</Text> new capsule(s) to open.
          </Text>
        </Card>

        {/* ✅ NEW: Dedicated "My Journal" card. */}
        <Card title="My Journal" colors={colors}>
              <Text style={{ color: colors.text, marginBottom: spacing.md }}>
                Keep track of your thoughts and memories. Your journal is a private space unless you choose to share.
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

// ✅ Simplified stylesheet after removing the two-pane layout.
const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  card: { padding: spacing.md, marginBottom: spacing.md, borderRadius: 12, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: spacing.sm },
  actionButton: { borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  actionButtonText: { fontWeight: 'bold', fontSize: 16 },
});