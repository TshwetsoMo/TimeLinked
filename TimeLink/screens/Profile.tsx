// src/screens/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  Alert,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// Import our services, hooks, and types
import { useAuth } from '../services/authContext';
import { useTheme } from '../theme/ThemeContext'; // Ensure this path is correct for your ThemeContext
import { updateUserProfile } from '../services/authService'; // Ensure this is importing from your auth.ts
import { uploadProfileImage } from '../services/storage';
import { spacing } from '../theme/spacing';

export default function ProfileScreen() {
  // ✅ FIX 1: Destructure `mode` instead of `theme`. The theme object itself is the return value.
  const { colors, mode, toggleTheme } = useTheme();
  const { user, userProfile } = useAuth();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [photoURL, setPhotoURL] = useState<string | null>(userProfile?.photoURL || null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setPhotoURL(userProfile.photoURL || null);
    }
  }, [userProfile]);

  if (!user || !userProfile) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const handleChoosePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      // ✅ FIX 2: The MediaType enum is deprecated. Use a simple string instead.
      mediaTypes: 'Images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets || !result.assets[0].uri) {
      return;
    }

    const uri = result.assets[0].uri;
    handleUploadPhoto(uri);
  };

  const handleUploadPhoto = async (uri: string) => {
    setUploading(true);
    try {
      const newPhotoURL = await uploadProfileImage(user.uid, uri);
      setPhotoURL(newPhotoURL);
      Alert.alert("Success", "Photo updated! Don't forget to save your profile.");
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!displayName.trim()) {
      return Alert.alert('Validation', 'Display name cannot be empty.');
    }

    setLoading(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        // ✅ FIX 3: Convert a `null` value to `undefined` to match the expected type.
        photoURL: photoURL || undefined,
      });
      Alert.alert('Success', 'Your profile has been updated.');
    } catch (error: any) {
      Alert.alert('Save Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.heading, { color: colors.text }]}>Your Profile</Text>

        <View style={styles.photoContainer}>
          <TouchableOpacity onPress={handleChoosePhoto} disabled={uploading}>
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.photo} />
            ) : (
              <View style={[styles.photoPlaceholder, { backgroundColor: colors.border }]}>
                <Text style={{ color: colors.textMuted }}>No Photo</Text>
              </View>
            )}
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color="#FFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
        <Text style={[styles.emailText, { color: colors.textMuted }]}>{user.email}</Text>

        <Text style={[styles.label, { color: colors.text }]}>Display Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your display name"
          placeholderTextColor={colors.textMuted}
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleSaveChanges}
          disabled={loading || uploading}
        >
          {loading ? (
            <ActivityIndicator color={colors.card} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.card }]}>Save Changes</Text>
          )}
        </TouchableOpacity>

        <View style={styles.settingsSection}>
          <Text style={[styles.heading, { color: colors.text, marginTop: spacing.lg }]}>Settings</Text>
          <View style={[styles.settingRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
            {/* ✅ FIX 1 (cont.): Use `mode` for the value check. */}
            <Switch
              value={mode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    container: { padding: spacing.lg },
    heading: { fontSize: 28, fontWeight: 'bold', marginBottom: spacing.md },
    photoContainer: { alignItems: 'center', marginVertical: spacing.md },
    photo: { width: 120, height: 120, borderRadius: 60 },
    photoPlaceholder: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
    uploadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
    label: { fontSize: 14, fontWeight: '600', marginBottom: spacing.sm, marginTop: spacing.md },
    input: { height: 50, borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, fontSize: 16 },
    emailText: { fontSize: 16, padding: spacing.sm },
    button: { height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg },
    buttonText: { fontSize: 18, fontWeight: 'bold' },
    settingsSection: { marginTop: spacing.xl, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderTopWidth: 1 },
    settingLabel: { fontSize: 16 },
});