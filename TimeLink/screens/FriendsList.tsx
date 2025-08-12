// src/screens/FriendsListScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Import our services, hooks, and types
import { RootStackParamList } from '../navigation/AppNavigation';
import { useAuth } from '../services/authContext';
import { useTheme } from '../theme/ThemeContext';
import { subscribeToConnections, removeConnection } from '../services/users';
import type { UserProfile } from '../types';
import { spacing } from '../theme/spacing';

// Define the route params for this screen
type Props = NativeStackScreenProps<RootStackParamList, 'FriendsList'>;

export default function FriendsListScreen({ route, navigation }: Props) {
  // Get global user state and current theme colors.
  const { user } = useAuth();
  const { colors } = useTheme();

  // This is the crucial logic for the screen's dual purpose.
  // It checks for a parameter passed during navigation. If `asPicker` is true,
  // the screen will behave as a selector. Otherwise, it's a standard list.
  const asPicker = route.params?.asPicker || false;

  // Local state to hold the list of friend profiles and a loading indicator.
  const [connections, setConnections] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // This effect subscribes to the user's connections for real-time updates.
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    // Calls the centralized service to listen for changes to the user's friends list.
    const unsubscribe = subscribeToConnections(user.uid, (fetchedConnections) => {
      setConnections(fetchedConnections);
      setLoading(false); // Hide the spinner once the first batch of data arrives.
    });

    // The returned function is a cleanup mechanism, called when the screen is
    // unmounted to prevent memory leaks by closing the connection to Firestore.
    return () => unsubscribe();
  }, [user]);
  
  // Handles removing a friend from the connections list.
  const handleRemoveFriend = (friend: UserProfile) => {
    if (!user) return;
    
    // Displays a native confirmation dialog to prevent accidental data loss.
    Alert.alert(
      "Remove Connection",
      `Are you sure you want to remove ${friend.displayName} from your connections?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          // If the user confirms, call the centralized `removeConnection` service.
          onPress: () => removeConnection(user.uid, friend.id)
            .catch(err => Alert.alert("Error", err.message))
        }
      ]
    );
  };
  
  // Handles what happens when a user card is tapped.
  const handleSelectFriend = (friend: UserProfile) => {
    // If in "picker" mode, navigate back to the previous screen (CreateCapsule)
    // and pass the selected friend's profile as a parameter.
    if (asPicker) {
      navigation.navigate('CreateCapsule', { selectedRecipient: friend });
    }
    // If not in picker mode, this could be used in the future to navigate
    // to a friend's profile page. For now, it does nothing.
  };

  // Defines how to render a single friend card in the FlatList.
  const renderConnection = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity
      style={[styles.friendCard, { backgroundColor: colors.card, shadowColor: colors.text }]}
      onPress={() => handleSelectFriend(item)}
      // The `disabled` prop is set to false here, but the `handleSelectFriend` function
      // will only perform an action if `asPicker` is true.
      disabled={!asPicker}
    >
      <Image
        source={item.photoURL ? { uri: item.photoURL } : require('../assets/logo.png')} // Uses profile photo or a fallback logo.
        style={styles.profileImage}
      />
      <View style={styles.friendInfo}>
        <Text style={[styles.friendName, { color: colors.text }]}>{item.displayName}</Text>
        <Text style={[styles.friendEmail, { color: colors.textMuted }]}>{item.email}</Text>
      </View>
      {/* The "Remove" button is only rendered if the screen is NOT in picker mode. */}
      {!asPicker && (
        <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveFriend(item)}>
          <Text style={[styles.removeButtonText, { color: colors.notification }]}>Remove</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  // Shows a loading spinner until the initial list of friends has been fetched.
  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        {/* The header's title and available actions change based on the `asPicker` mode. */}
        <View style={[styles.headerContainer, { borderBottomColor: colors.border }]}>
            <Text style={[styles.header, { color: colors.text }]}>
                {asPicker ? 'Select a Recipient' : 'Your Connections'}
            </Text>
            {!asPicker && (
                <TouchableOpacity style={[styles.addButton, {backgroundColor: colors.primary}]} onPress={()=> navigation.navigate('SearchUsers')}>
                    <Text style={{color: colors.card, fontWeight: 'bold'}}>Add Friends</Text>
                </TouchableOpacity>
            )}
        </View>

        {/* FlatList is a high-performance component for rendering the scrollable list of friends. */}
        <FlatList
            data={connections}
            keyExtractor={(item) => item.id}
            renderItem={renderConnection}
            contentContainerStyle={styles.listContainer}
            // This component is displayed when the data list is empty.
            ListEmptyComponent={
                <View style={styles.placeholderContainer}>
                    <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
                    You don't have any connections yet.
                    </Text>
                    {/* The "Find Friends" link is only shown if not in picker mode. */}
                    {!asPicker && (
                        <TouchableOpacity onPress={() => navigation.navigate('SearchUsers')}>
                            <Text style={[styles.link, { color: colors.primary }]}>Find some friends!</Text>
                        </TouchableOpacity>
                    )}
                </View>
            }
        />
    </SafeAreaView>
  );
}

// All styles are themed and use consistent spacing.
const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerContainer: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#eee', // Note: hardcoded color
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: { fontSize: 28, fontWeight: 'bold' },
  addButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 6 },
  listContainer: { padding: spacing.md },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendEmail: {
    fontSize: 14,
  },
  removeButton: {
    paddingHorizontal: spacing.sm,
  },
  removeButtonText: {
    color: '#D32F2F', // Note: hardcoded color
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
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  link: {
      fontSize: 16,
      fontWeight: 'bold',
  }
});