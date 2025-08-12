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

// Import our services, hooks, and types
import { RootStackParamList } from '../navigation/AppNavigation';
import { useAuth } from '../services/authContext';
import { useTheme } from '../theme/ThemeContext';
import { searchUsersByEmail, addConnection, subscribeToConnections } from '../services/users';
import type { UserProfile } from '../types';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'SearchUsers'>;

export default function SearchUsersScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { colors } = useTheme();

  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // ✅ NEW: State to hold the user's current connections
  const [myConnections, setMyConnections] = useState<string[]>([]);
  const [addedThisSession, setAddedThisSession] = useState<string[]>([]);

  // ✅ NEW: Subscribe to current connections to know who is already a friend.
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToConnections(user.uid, (connections) => {
      const connectionIds = connections.map(c => c.id);
      setMyConnections(connectionIds);
    });
    return () => unsubscribe();
  }, [user]);


  const handleSearch = async () => {
    if (!user || !searchEmail.trim()) {
      return Alert.alert("Input Required", "Please enter an email address to search.");
    }

    Keyboard.dismiss();
    setLoading(true);
    setHasSearched(true);
    setSearchResults([]);

    try {
      const results = await searchUsersByEmail(searchEmail.trim(), user.uid);
      setSearchResults(results);
    } catch (error: any) {
      Alert.alert("Search Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (friend: UserProfile) => {
    if (!user) return;

    try {
      await addConnection(user.uid, friend.id);
      Alert.alert("Success!", `You are now connected with ${friend.displayName}.`);
      setAddedThisSession(prev => [...prev, friend.id]);
    } catch (error: any) {
      // The error alert from before is already perfect.
      Alert.alert("Error", `Could not connect with ${friend.displayName}. Please try again.`);
    }
  };

  const renderSearchResult = ({ item }: { item: UserProfile }) => {
    // ✅ NEW: Determine the status of the button
    const isAlreadyConnected = myConnections.includes(item.id);
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

        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="friend@example.com"
            placeholderTextColor={colors.textMuted}
            value={searchEmail}
            onChangeText={setSearchEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            onSubmitEditing={handleSearch}
          />
        </View>
        <TouchableOpacity style={[styles.searchButton, { backgroundColor: colors.primary }]} onPress={handleSearch} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.card} />
          ) : (
            <Text style={[styles.searchButtonText, { color: colors.card }]}>Search</Text>
          )}
        </TouchableOpacity>

        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={renderSearchResult}
          style={styles.resultsList}
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

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: spacing.md },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: spacing.sm },
  subHeader: { fontSize: 16, marginBottom: spacing.lg },
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
  addButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 6, minWidth: 70, alignItems: 'center' },
  addButtonText: { fontSize: 14, fontWeight: 'bold' },
  placeholderContainer: { marginTop: 100, alignItems: 'center' },
  placeholderText: { fontSize: 16, fontStyle: 'italic' },
});