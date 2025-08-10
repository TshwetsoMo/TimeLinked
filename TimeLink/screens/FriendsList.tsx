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
import { useTheme } from '../theme/useTheme';
import { subscribeToConnections, removeConnection } from '../services/users';
import type { UserProfile } from '../types';
import { spacing } from '../theme/spacing';

// Define the route params for this screen
type Props = NativeStackScreenProps<RootStackParamList, 'FriendsList'>;

export default function FriendsListScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  const { colors } = useTheme();

  // Check if the screen is being used as a recipient picker
  const asPicker = route.params?.asPicker || false;

  const [connections, setConnections] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    // Subscribe to the user's connections for real-time updates
    const unsubscribe = subscribeToConnections(user.uid, (fetchedConnections) => {
      setConnections(fetchedConnections);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [user]);
  
  const handleRemoveFriend = (friend: UserProfile) => {
    if (!user) return;
    
    Alert.alert(
      "Remove Connection",
      `Are you sure you want to remove ${friend.displayName} from your connections?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: () => removeConnection(user.uid, friend.id)
            .catch(err => Alert.alert("Error", err.message))
        }
      ]
    );
  };
  
  const handleSelectFriend = (friend: UserProfile) => {
    // If in picker mode, navigate back with the selected friend's data
    if (asPicker) {
      navigation.navigate('CreateCapsule', { selectedRecipient: friend });
    }
    // If not in picker mode, you could navigate to their profile, for example.
    // For now, we do nothing.
  };

  const renderConnection = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity
      style={[styles.friendCard, { backgroundColor: colors.card, shadowColor: colors.text }]}
      onPress={() => handleSelectFriend(item)}
      disabled={!asPicker} // Only allow presses in picker mode
    >
      <Image
        source={item.photoURL ? { uri: item.photoURL } : require('../assets/logo.png')} // Fallback image
        style={styles.profileImage}
      />
      <View style={styles.friendInfo}>
        <Text style={[styles.friendName, { color: colors.text }]}>{item.displayName}</Text>
        <Text style={[styles.friendEmail, { color: colors.textMuted }]}>{item.email}</Text>
      </View>
      {!asPicker && (
        <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveFriend(item)}>
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.headerContainer}>
            <Text style={[styles.header, { color: colors.text }]}>
                {asPicker ? 'Select a Recipient' : 'Your Connections'}
            </Text>
            {!asPicker && (
                <TouchableOpacity style={[styles.addButton, {backgroundColor: colors.primary}]} onPress={()=> navigation.navigate('SearchUsers')}>
                    <Text style={{color: colors.card, fontWeight: 'bold'}}>Add Friends</Text>
                </TouchableOpacity>
            )}
        </View>

        <FlatList
            data={connections}
            keyExtractor={(item) => item.id}
            renderItem={renderConnection}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
                <View style={styles.placeholderContainer}>
                    <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
                    You don't have any connections yet.
                    </Text>
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

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerContainer: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    color: '#D32F2F',
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