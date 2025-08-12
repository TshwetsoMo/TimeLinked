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
import { searchUsersByEmail, addConnection, subscribeToConnections } from '../services/users';
import type { UserProfile } from '../types';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'SearchUsers'>;

export default function SearchUsersScreen({ navigation }: Props) {
  // Get global user state and current theme colors.
  const { user } = useAuth();
  const { colors } = useTheme();

  // Local state for the search form and results.
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // State to hold the IDs of the user's current friends. This is crucial for the "smart button".
  const [myConnectionIds, setMyConnectionIds] = useState<string[]>([]);
  // State to track users added during this session for immediate UI feedback.
  const [addedThisSession, setAddedThisSession] = useState<string[]>([]);

  // This effect subscribes to the user's current connections in real-time.
  // This ensures the "Add" button status is always accurate, even if a connection is
  // made or removed on another device.
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToConnections(user.uid, (connections) => {
      const connectionIds = connections.map(c => c.id);
      setMyConnectionIds(connectionIds);
    });
    // Cleanup the subscription on unmount.
    return () => unsubscribe();
  }, [user]);

  // Handles the user search operation.
  const handleSearch = async () => {
    if (!user || !searchEmail.trim()) {
      return Alert.alert("Input Required", "Please enter an email address to search.");
    }

    Keyboard.dismiss(); // Dismiss the keyboard for a better UX.
    setLoading(true);
    setHasSearched(true);
    setSearchResults([]); // Clear previous results before a new search.

    try {
      // Calls the centralized service to query the 'users' collection.
      const results = await searchUsersByEmail(searchEmail.trim(), user.uid);
      setSearchResults(results);
    } catch (error: any) {
      Alert.alert("Search Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handles the "Add Friend" action.
  const handleAddFriend = async (friend: UserProfile) => {
    if (!user) return;

    try {
      // Calls the centralized service, which performs an atomic batch write
      // to create the mutual connection.
      await addConnection(user.uid, friend.id);
      Alert.alert("Success!", `You are now connected with ${friend.displayName}.`);
      // Update the local state to give the user immediate UI feedback.
      setAddedThisSession(prev => [...prev, friend.id]);
    } catch (error: any) {
      Alert.alert("Error", `Could not connect with ${friend.displayName}. Please try again.`);
    }
  };

  // Defines how to render a single user card in the search results.
  const renderSearchResult = ({ item }: { item: UserProfile }) => {
    // This logic creates a "smart button" that changes its state and appearance.
    const isAlreadyConnected = myConnectionIds.includes(item.id);
    const wasAddedThisSession = addedThisSession.includes(item.id);
    const isDisabled = isAlreadyConnected || wasAddedThisSession;

    let buttonText = 'Add';
    if (isAlreadyConnected) buttonText = 'Connected';
    if (wasAddedThisSession) buttonText = 'Added';

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
          onPress={() => handleAddFriend(item)}
          disabled={isDisabled}
        >
          <Text style={[styles.addButtonText, { color: isDisabled ? colors.textMuted : colors.card }]}>
            {buttonText}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Text style={[styles.header, { color: colors.text }]}>Find Connections</Text>
        <Text style={[styles.subHeader, { color: colors.textMuted }]}>
          Add friends by searching for their email address.
        </Text>

        {/* Search input and button */}
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="friend@example.com"
            placeholderTextColor={colors.textMuted}
            value={searchEmail}
            onChangeText={setSearchEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            onSubmitEditing={handleSearch} // Allows searching by pressing "return" on the keyboard
          />
        </View>
        <TouchableOpacity style={[styles.searchButton, { backgroundColor: colors.primary }]} onPress={handleSearch} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.card} />
          ) : (
            <Text style={[styles.searchButtonText, { color: colors.card }]}>Search</Text>
          )}
        </TouchableOpacity>

        {/* List to display search results. */}
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={renderSearchResult}
          style={styles.resultsList}
          // Provides helpful feedback to the user when the list is empty.
          ListEmptyComponent={
            <View style={styles.placeholderContainer}>
              <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
                {hasSearched ? "No users found for that email." : "Enter an email to find a user."}
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

// All styles are themed and use consistent spacing.
const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: spacing.md },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: spacing.sm },
  subHeader: { fontSize: 16, marginBottom: spacing.lg, color: '#888' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  input: { height: 50, borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, fontSize: 16, flex: 1 },
  searchButton: { height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg },
  searchButtonText: { fontSize: 18, fontWeight: 'bold' },
  resultsList: { marginTop: spacing.lg },
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
  addButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 6, minWidth: 80, alignItems: 'center' },
  addButtonText: { fontSize: 14, fontWeight: 'bold' },
  placeholderContainer: { marginTop: 100, alignItems: 'center' },
  placeholderText: { fontSize: 16, fontStyle: 'italic' },
});