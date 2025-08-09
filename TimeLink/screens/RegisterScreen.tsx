// screens/RegisterScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Button,
  Alert,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigation';
import { useTheme } from '../theme/useTheme';
import { spacing } from '../theme/spacing';
import { useAuth } from '../services/authContext';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../services/firebase'; // make sure this path is correct

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigation.replace('Dashboard');
    }
  }, [user, navigation]);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      return Alert.alert('Validation', 'Please fill out all fields.');
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name.trim() });
      }
      // You can optionally navigate here or rely on auth context to redirect
      // navigation.replace('Dashboard');
    } catch (error: any) {
      let errorMessage = 'Something went wrong during registration.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already in use.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      }
      Alert.alert('Registration Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = name.trim() !== '' && email.trim() !== '' && password !== '';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <Text style={[styles.header, { color: colors.text }]}>Create Account</Text>

        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.inputBg,
              color: colors.text,
              marginBottom: spacing.md,
            },
          ]}
          placeholder="Name"
          placeholderTextColor={colors.secondary}
          value={name}
          onChangeText={setName}
          editable={!loading}
          autoCapitalize="words"
        />

        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.inputBg,
              color: colors.text,
              marginBottom: spacing.md,
            },
          ]}
          placeholder="Email"
          placeholderTextColor={colors.secondary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />

        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.inputBg,
              color: colors.text,
              marginBottom: spacing.lg,
            },
          ]}
          placeholder="Password"
          placeholderTextColor={colors.secondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />

        <Button
          title={loading ? 'Registering…' : 'Register'}
          onPress={handleRegister}
          color={colors.primary}
          disabled={loading || !isFormValid}
        />

        <Text
          style={[styles.link, { color: colors.primary, marginTop: spacing.lg }]}
          onPress={() => navigation.navigate('Welcome')}
        >
          ← Back
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, justifyContent: 'center' },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  link: {
    textAlign: 'center',
    fontSize: 16,
  },
});

