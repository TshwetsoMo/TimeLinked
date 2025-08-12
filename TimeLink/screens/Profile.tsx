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

// Import services and hooks
import { useAuth } from '../services/authContext';
import { useTheme } from '../theme/ThemeContext';
import { updateUserProfile } from '../services/authService'; // Note: Potential incorrect import path
import { uploadProfileImage } from '../services/storage';
import { spacing } from '../theme/spacing';

export default function ProfileScreen() {
  // Get global user state and the full theme object, including the toggle function.
  const { colors, mode, toggleTheme } = useTheme();
  const { user, userProfile } = useAuth();

  // Local state for the form inputs, initialized from the global userProfile.
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [photoURL, setPhotoURL] = useState<string | null>(userProfile?.photoURL || null);
  
  // Separate loading states for clarity: `loading` for form submission, `uploading` for image uploads.
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // This effect ensures that if the global userProfile changes (e.g., after a successful save),
  // the local state of this form is updated to match.
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setPhotoURL(userProfile.photoURL || null);
    }
  }, [userProfile]);

  // A guard clause to show a loading spinner until the user's data is available.
  if (!user || !userProfile) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  // Handles the process of selecting an image from the device's library.
  const handleChoosePhoto = async () => {
    // 1. Request permission to access the media library.
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant access to your photo library.');
      return;
    }

    // 2. Launch the native image picker UI.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1], // Enforce a square aspect ratio.
      quality: 0.7,   // Compress the image slightly for faster uploads.
    });

    // 3. If the user didn't cancel, proceed to upload the selected image.
    if (result.canceled || !result.assets || !result.assets[0].uri) {
      return;
    }

    const uri = result.assets[0].uri;
    handleUploadPhoto(uri);
  };

  // Handles uploading the chosen image to Firebase Storage.
  const handleUploadPhoto = async (uri: string) => {
    setUploading(true);
    try {
      // Calls the centralized service to handle the upload and get the public URL.
      const newPhotoURL = await uploadProfileImage(user.uid, uri);
      // Update the local state to show the new image immediately in the UI.
      setPhotoURL(newPhotoURL);
      Alert.alert("Success", "Photo updated! Don't forget to save your profile.");
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message);
    } finally {
      setUploading(false);
    }
  };

  // Handles the final submission of the profile form.
  const handleSaveChanges = async () => {
    if (!displayName.trim()) {
      return Alert.alert('Validation', 'Display name cannot be empty.');
    }

    setLoading(true);
    try {
      // A single, clean call to the centralized `updateUserProfile` service.
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        photoURL: photoURL || undefined, // Pass `undefined` if photoURL is null to avoid Firestore errors.
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

        {/* Profile picture uploader section. */}
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

        {/* The main submission button for saving all profile changes. */}
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

        {/* The settings section, including the theme toggle. */}
        <View style={styles.settingsSection}>
          <Text style={[styles.heading, { color: colors.text, marginTop: spacing.lg }]}>Settings</Text>
          <View style={[styles.settingRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
            {/* The Switch component's value is bound to the current theme mode. */}
            {/* `onValueChange` calls the `toggleTheme` function from our ThemeContext. */}
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

// All styles are themed and use consistent spacing.
const styles = StyleSheet.create({
    safe: { flex: 1 },
    container: { padding: spacing.lg, paddingBottom: 50 }, // Added paddingBottom for better scroll
    heading: { fontSize: 28, fontWeight: 'bold', marginBottom: spacing.md },
    photoContainer: { alignItems: 'center', marginVertical: spacing.md },
    photo: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: '#fff' }, // Added border for pop
    photoPlaceholder: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
    uploadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
    label: { fontSize: 14, fontWeight: '600', marginBottom: spacing.sm, marginTop: spacing.md },
    input: { height: 50, borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, fontSize: 16 },
    emailText: { fontSize: 16, padding: spacing.sm, color: '#888' }, // Note: hardcoded color
    button: { height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg },
    buttonText: { fontSize: 18, fontWeight: 'bold' },
    settingsSection: { marginTop: spacing.xl },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderTopWidth: 1 },
    settingLabel: { fontSize: 16 },
});