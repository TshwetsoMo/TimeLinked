// src/screens/SearchUsersScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { collection, onSnapshot } from 'firebase/firestore';

// Import services, hooks, and types
import { RootStackParamList } from '../navigation/AppNavigation';
import { useAuth } from '../services/authContext';
import { useTheme } from '../theme/ThemeContext';
// ✅ Import the new `sendFriendRequest` function and `getSuggestedUsers`. `addConnection` is no longer needed here.
import { searchUsersByEmail, sendFriendRequest, subscribeToConnections, getSuggestedUsers } from '../services/users';
import { db } from '../services/firebase'; // ✅ Import `db` for our new listener
import type { UserProfile } from '../types';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'SearchUsers'>;

export default function SearchUsersScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { colors } = useTheme();

  // State for the search functionality.
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // State for the initial user suggestions.
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  
  // State to track the user's relationships for UI feedback.
  const [myConnectionIds, setMyConnectionIds] = useState<string[]>([]);
  const [outgoingRequestIds, setOutgoingRequestIds] = useState<string[]>([]);

  // This effect subscribes to the user's established connections in real-time.
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToConnections(user.uid, (connections) => {
      const connectionIds = connections.map(c => c.id);
      setMyConnectionIds(connectionIds);
    });
    return () => unsubscribe();
  }, [user]);

  // ✅ NEW: This effect subscribes to the user's SENT friend requests.
  // This is crucial for updating the button state to "Request Sent".
  useEffect(() => {
    if (!user) return;
    const requestsRef = collection(db, 'users', user.uid, 'outgoingFriendRequests');
    const unsubscribe = onSnapshot(requestsRef, (snapshot) => {
      const requestIds = snapshot.docs.map(doc => doc.id);
      setOutgoingRequestIds(requestIds);
    });
    return () => unsubscribe();
  }, [user]);

  // This effect fetches initial user suggestions when the screen loads.
  useEffect(() => {
    const fetchSuggestions = async () => {
      // ... (This function is unchanged and correct)
    };
    fetchSuggestions();
  }, [user]);

  // Handles the user search operation. (This function is unchanged and correct).
  const handleSearch = async () => {
    // ... (This function is unchanged and correct)
  };

  // ✅ UPDATED: This function now sends a request instead of instantly adding a friend.
  const handleSendRequest = async (friend: UserProfile) => {
    if (!user) return;
    try {
      // Calls the new centralized service function.
      await sendFriendRequest(user.uid, friend.id);
      Alert.alert("Success!", `Your friend request has been sent to ${friend.displayName}.`);
      // We no longer need to update local state; the real-time listener will do it for us.
    } catch (error: any) {
      Alert.alert("Error", `Could not send request. Please try again.`);
    }
  };

  // Renders a single user card in either the search results or suggestions list.
  const renderUserCard = ({ item }: { item: UserProfile }) => {
    // This logic creates a "smart button" that changes based on the user's relationship.
    const isAlreadyConnected = myConnectionIds.includes(item.id);
    const hasSentRequest = outgoingRequestIds.includes(item.id);
    const isDisabled = isAlreadyConnected || hasSentRequest;

    let buttonText = 'Add';
    if (isAlreadyConnected) buttonText = 'Connected';
    if (hasSentRequest) buttonText = 'Request Sent';

    return (
      <View style={[styles.resultCard, { backgroundColor: colors.card, shadowColor: colors.text }]}>
        <Image 
            source={item.photoURL ? { uri: item.photoURL } : require('../assets/logo.png')}
            style={styles.profileImage}
        />
        <View style={styles.userInfo}>
            <Text style={[styles.resultName, { color: colors.text }]}>{item.displayName}</Text>
            <Text style={[styles.resultEmail, { color: colors.textMuted }]}>{item.email}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.addButton,
            { backgroundColor: isDisabled ? colors.border : colors.primary }
          ]}
          onPress={() => handleSendRequest(item)}
          disabled={isDisabled}
        >
          <Text style={[styles.addButtonText, { color: isDisabled ? colors.textMuted : colors.card }]}>
            {buttonText}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // This logic determines which list to show: search results or suggestions.
  const listData = hasSearched ? searchResults : suggestedUsers;
  
  if (suggestionsLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Text style={[styles.header, { color: colors.text }]}>Find Connections</Text>
        <Text style={[styles.subHeader, { color: colors.textMuted }]}>
          Search by email or discover people below.
        </Text>

        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="friend@example.com"
            placeholderTextColor={colors.textMuted}
            value={searchEmail}
            onChangeText={(text) => {
              setSearchEmail(text);
              // If the user clears the search bar, revert to showing suggestions.
              if (text.trim() === '') {
                setHasSearched(false);
              }
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            onSubmitEditing={handleSearch}
          />
        </View>
        <TouchableOpacity style={[styles.searchButton, { backgroundColor: colors.primary }]} onPress={handleSearch} disabled={searchLoading}>
          {searchLoading ? (
            <ActivityIndicator color={colors.card} />
          ) : (
            <Text style={[styles.searchButtonText, { color: colors.card }]}>Search</Text>
          )}
        </TouchableOpacity>

        {/* This FlatList now dynamically displays either search results or suggestions. */}
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          renderItem={renderUserCard}
          style={styles.resultsList}
          ListHeaderComponent={
            <Text style={[styles.listHeader, { color: colors.text }]}>
              {hasSearched ? 'Search Results' : 'Suggestions'}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.placeholderContainer}>
              <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
                {hasSearched ? "No users found for that email." : "No suggestions available."}
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

// Styles have been updated slightly to accommodate the list header.
const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: spacing.md },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: spacing.sm },
  subHeader: { fontSize: 16, marginBottom: spacing.lg },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  input: { height: 50, borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, fontSize: 16, flex: 1 },
  searchButton: { height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg },
  searchButtonText: { fontSize: 18, fontWeight: 'bold' },
  resultsList: { marginTop: spacing.md },
  listHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm
  },
  resultCard: {
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
  profileImage: { width: 40, height: 40, borderRadius: 20, marginRight: spacing.md },
  userInfo: { flex: 1 },
  resultName: { fontSize: 16, fontWeight: 'bold' },
  resultEmail: { fontSize: 14 },
  addButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 6, minWidth: 100, alignItems: 'center' },
  addButtonText: { fontSize: 14, fontWeight: 'bold' },
  placeholderContainer: { marginTop: 50, alignItems: 'center' },
  placeholderText: { fontSize: 16, fontStyle: 'italic' },
});