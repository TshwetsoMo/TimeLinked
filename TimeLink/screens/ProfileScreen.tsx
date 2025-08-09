// src/screens/Profile.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Button,
  Image,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, storage } from '../services/firebase';
import { updateProfile as firebaseUpdateProfile, User } from 'firebase/auth';
import { useTheme } from '../theme/useTheme';

/**
 * Convert a local URI to a Blob
 */
function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = () => reject(new TypeError('Network request failed'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

export default function ProfileScreen() {
  const user = auth.currentUser as User;
  const { colors } = useTheme();

  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [photoURL, setPhotoURL] = useState<string | null>(user.photoURL);
  const [loading, setLoading] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false); // Placeholder toggle

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const data = snap.data() as any;
          if (data.displayName) setDisplayName(data.displayName);
          if (data.photoURL) setPhotoURL(data.photoURL);
        }
      } catch (err: any) {
        console.warn('Could not load profile:', err.message);
      }
    })();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      mediaTypes: ImagePicker.MediaType.Images,
    });
    if (result.cancelled) return;
    // @ts-ignore
    const uri = result.assets?.[0]?.uri ?? (result as any).uri;
    if (!uri) return Alert.alert('Upload failed', 'Could not get the image URI.');
    uploadImage(uri);
  };

  const uploadImage = async (uri: string) => {
    setLoading(true);
    try {
      const blob = await uriToBlob(uri);
      const storageRef = ref(storage, `profiles/${user.uid}.jpg`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      setPhotoURL(url);
    } catch (err: any) {
      Alert.alert('Upload failed', err.message || err.toString());
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      await firebaseUpdateProfile(user, {
        displayName,
        photoURL: photoURL || undefined,
      });

      await setDoc(
        doc(db, 'users', user.uid),
        {
          displayName,
          photoURL: photoURL || null,
          email: user.email,
        },
        { merge: true }
      );

      Alert.alert('Profile saved');
    } catch (err: any) {
      Alert.alert('Save failed', err.message || err.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Text style={[styles.heading, { color: colors.text }]}>Your Profile</Text>

        <View style={styles.photoContainer}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.photo} />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: colors.border }]}>
              <Text style={{ color: colors.text }}>No Photo</Text>
            </View>
          )}
          <Button title="Change Photo" onPress={pickImage} disabled={loading} />
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Display Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
          value={displayName}
          onChangeText={setDisplayName}
          editable={!loading}
          placeholder="Your name"
          placeholderTextColor={colors.secondary}
        />

        <Text style={[styles.label, { color: colors.text }]}>Email</Text>
        <Text style={[styles.email, { color: colors.secondary }]}>{user.email}</Text>

        <Button
          title={loading ? 'Saving…' : 'Save Profile'}
          onPress={saveProfile}
          disabled={loading}
        />

        {/* SETTINGS */}
        <View style={{ marginTop: 30 }}>
          <Text style={[styles.heading, { color: colors.text }]}>Settings</Text>

          <View style={styles.settingRow}>
            <Text style={[styles.label, { color: colors.text }]}>Enable Dark Mode</Text>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: '#ccc', true: colors.primary }}
              thumbColor={darkModeEnabled ? colors.text : '#f4f3f4'}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 20 },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  photoContainer: { alignItems: 'center', marginBottom: 20 },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 8,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: { marginTop: 12, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  email: { fontSize: 16, marginBottom: 20 },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
});