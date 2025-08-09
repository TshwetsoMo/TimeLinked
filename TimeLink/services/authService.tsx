import { auth, db } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("User logged in:", userCredential.user);
  } catch (error: any) {
    console.error("Error logging in:", error.code, error.message);
    throw error;
  }
};

export const registerUser = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Save user info to Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      createdAt: new Date()
    });
    console.log("User registered and saved to Firestore:", user);
  } catch (error: any) {
    console.error("Error registering:", error.code, error.message);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log("User logged out successfully");
  } catch (error: any) {
    console.error("Error logging out:", error);
    throw error;
  }
};

export const getUserInfo = () => {
  return auth.currentUser;
};