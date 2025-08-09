// config/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC5kF5MuO9QLr-fJSELasl8WrMoYElw_9I",
  authDomain: "dv300-classproj2025.firebaseapp.com",
  projectId: "dv300-classproj2025",
  storageBucket: "dv300-classproj2025.appspot.com",
  messagingSenderId: "430663122571",
  appId: "1:430663122571:web:9b57139c29511b317f1e8e",
  measurementId: "G-YFW8CFBN5D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
