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

// Import services, hooks, and types
import { RootStackParamList } from '../navigation/AppNavigation';
import { useAuth } from '../services/authContext';
import { useTheme } from '../theme/ThemeContext';
// ✅ Import all necessary user service functions. `addConnection` is gone.
import { searchUsersByEmail, sendFriendRequest, subscribeToConnections, subscribeToOutgoingFriendRequests, getSuggestedUsers } from '../services/users';
import type { UserProfile } from '../types';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'SearchUsers'>;

export default function SearchUsersScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { colors } = useTheme();

  // State for search and suggestions
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  
  // State to track user's relationships for the UI
  const [myConnectionIds, setMyConnectionIds] = useState<string[]>([]);
  const [outgoingRequestIds, setOutgoingRequestIds] = useState<string[]>([]);

  // Subscribe to the user's established friends list.
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToConnections(user.uid, (connections) => {
      setMyConnectionIds(connections.map(c => c.id));
    });
    return unsubscribe;
  }, [user]);

  // ✅ Subscribe to the user's outgoing (sent) friend requests for real-time button status.
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToOutgoingFriendRequests(user.uid, (requests) => {
      setOutgoingRequestIds(requests.map(r => r.id));
    });
    return unsubscribe;
  }, [user]);

  // Fetch initial user suggestions when the screen loads.
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!user) return;
      setSuggestionsLoading(true);
      try {
        const suggestions = await getSuggestedUsers(10);
        setSuggestedUsers(suggestions.filter(u => u.id !== user.uid));
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      } finally {
        setSuggestionsLoading(false);
      }
    };
    fetchSuggestions();
  }, [user]);

  // Handles the search operation. (Unchanged and correct)
  const handleSearch = async () => {
    if (!user || !searchEmail.trim()) return Alert.alert("Input Required", "Please enter an email address.");
    Keyboard.dismiss();
    setSearchLoading(true);
    setHasSearched(true);
    setSearchResults([]);
    try {
      const results = await searchUsersByEmail(searchEmail.trim(), user.uid);
      setSearchResults(results);
    } catch (error: any) {
      Alert.alert("Search Error", error.message);
    } finally {
      setSearchLoading(false);
    }
  };

  // ✅ Replaced `handleAddFriend` with `handleSendRequest` to use the new system.
  const handleSendRequest = async (friend: UserProfile) => {
    if (!user) return;
    try {
      await sendFriendRequest(user.uid, friend.id);
      Alert.alert("Success!", `Your friend request has been sent to ${friend.displayName}.`);
      // No local state update needed; the real-time listener will handle the UI change.
    } catch (error: any) {
      Alert.alert("Error", `Could not send request. Please try again.`);
    }
  };

  // Renders a single user card in the list.
  const renderUserCard = ({ item }: { item: UserProfile }) => {
    // ✅ The button's state is now driven by two real-time listeners.
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
          style={[styles.addButton, { backgroundColor: isDisabled ? colors.border : colors.primary }]}
          // ✅ The button now calls the correct handler function.
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
              if (text.trim() === '') setHasSearched(false);
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            onSubmitEditing={handleSearch}
          />
        </View>
        <TouchableOpacity style={[styles.searchButton, { backgroundColor: colors.primary }]} onPress={handleSearch} disabled={searchLoading}>
          {searchLoading ? <ActivityIndicator color={colors.card} /> : <Text style={[styles.searchButtonText, { color: colors.card }]}>Search</Text>}
        </TouchableOpacity>
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          renderItem={renderUserCard}
          style={styles.resultsList}
          ListHeaderComponent={ <Text style={[styles.listHeader, { color: colors.text }]}> {hasSearched ? 'Search Results' : 'Suggestions'} </Text> }
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
  listHeader: { fontSize: 18, fontWeight: '600', marginBottom: spacing.md, paddingHorizontal: spacing.sm },
  resultCard: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: 12, marginBottom: spacing.md, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
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