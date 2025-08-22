# TimeLink - Stay connected, across time and memory

TimeLink is a cross-platform (iOS & Android) React Native app built with **Expo** and **TypeScript**. It helps you preserve connection across time through **Daily Journals** and **Scheduled Time Capsules** (messages that arrive at meaningful future moments). The UI has **landscape affinity** and the backend uses **Firebase** (Auth, Firestore, Storage).

---

## ✨ Features

- **Welcome / Onboarding** - quick access to Register and Login
- **Authentication** - Email/Password via Firebase Auth with persistent sessions
- **Dashboard (Landscape)** - sections: My Stats, Your Inbox, My Journal, My Time Capsules, Explore & Connect
- **Daily Journal** - private, friends, and public entries (CRUD) with timestamps
- **Time Capsules** - compose messages, choose future delivery date/time
- **Profile** - update display name and photo (Storage upload via `expo-image-picker`), light/dark theme toggle
- **Micro-interactions** - Reanimated + Moti
- **Accessibility** - sensible contrast, large touch targets, readable typography

---

## 🧱 Tech Stack

- **Runtime:** Expo SDK 53, React Native 0.79, TypeScript
- **Navigation:** `@react-navigation/native` + Native Stack
- **Backend:** Firebase (Authentication, Firestore, Storage)
- **Animations:** `react-native-reanimated`, `moti`
- **Media:** `expo-image-picker`

---

## 📦 Requirements

- **Node.js LTS** recommended (v18 or v20)
- **Expo Go** installed on your device (Android/iOS)
- A **Firebase project** with **Auth**, **Firestore**, and **Storage** enabled

---

## 🚀 Quick Start

```bash
# install dependencies
npm install

# start the dev server (tunnel is most reliable)
npx expo start --tunnel
```

Scan the QR in **Expo Go**.

If LAN fails (VPN or firewall), keep using `--tunnel`.

If you previously installed the legacy global CLI, remove it:

```bash
npm uninstall -g expo-cli
```

---

## 🗂️ Project Structure

```
/src
  /config
    firebaseConfig.ts
  /context
    AuthContext.tsx                  # or /services/authContext.tsx if you prefer
  /navigation
    AppNavigation.tsx                # exports RootStackParamList + Stack
  /screens
    WelcomeScreen.tsx
    LoginScreen.tsx
    RegisterScreen.tsx
    DashboardScreen.tsx
    JournalScreen.tsx
    CreateCapsuleScreen.tsx
    Profile.tsx
    FriendsList.tsx                  # optional
  /services
    capsules.ts                      # createCapsule, updateCapsule, getCapsule...
    users.ts                         # getUserProfile, update user doc...
  /theme
    ThemeContext.tsx
    useTheme.ts
    spacing.ts
App.tsx
babel.config.js
package.json
```

---

## 🔐 Firebase Setup

Create a Firebase project, add a Web App, copy the config, enable Email/Password auth, create a Firestore database (test mode for development), and enable Storage.

**`/src/config/firebaseConfig.ts`**

```ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "...",
  appId: "...",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

Note: In client apps, Firebase config keys are public by design. Keep rules strict.

---

## 🗃️ Firestore Data Model

**Collections**

```
/users/{uid}
  displayName: string
  email: string
  photoURL?: string
  createdAt: Timestamp

/journalEntries/{entryId}
  userId: string
  content: string
  createdAt: Timestamp
  mood?: string

/timeCapsules/{capsuleId}
  userId: string          # sender uid
  recipientId: string     # recipient uid or email-derived ID
  title?: string
  message: string
  deliveryDate: Timestamp
  createdAt: Timestamp
  status: 'scheduled' | 'delivered'
```

Delivery timing (MVP): show capsules as available when `deliveryDate <= now`.
Production idea: use Cloud Scheduler + Cloud Functions to mark final delivery server side.

---

## 🔒 Example Security Rules (Development)

**Firestore** (lenient for development - lock down for production)

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    match /journalEntries/{id} {
      allow read, write: if request.auth != null &&
        request.resource.data.userId == request.auth.uid;
    }

    match /timeCapsules/{id} {
      allow create, update, delete: if request.auth != null &&
        request.resource.data.userId == request.auth.uid;

      allow get, list: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        resource.data.recipientId == request.auth.uid
      );
    }
  }
}
```

**Storage** (profile photos)

```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profiles/{uid}.jpg {
      allow read: if true; // or restrict by auth
      allow write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

---

## 🧰 Helpful Commands

**Install matching Expo modules if needed**

```bash
npx expo install react-native-screens react-native-safe-area-context react-native-reanimated expo-image-picker
```

**Clear Metro cache**

```bash
npx expo start -c
```

**Use tunnel if LAN fails**

```bash
npx expo start --tunnel
```

---

## 📱 Expo Go Tips

- If QR scan does not load the app:

  - Use tunnel mode.
  - Ensure phone and computer are on the same Wi-Fi if using LAN.
  - Disable VPN or firewall, or keep using `--tunnel`.

- Android USB development:

  ```bash
  npx expo start --localhost
  adb reverse tcp:8081 tcp:8081
  ```

---

## 🎨 Mockups

**Option A: Local images in repo**

```
/docs/mockups/
  01_welcome.png
  02_register.png
  03_login.png
  04_dashboard_landscape.png
  05_create_capsule.png
  06_profile.png
```

Embed:

```md
![Welcome](docs/mockups/01_welcome.png)
![Register](docs/mockups/02_register.png)
![Login](docs/mockups/03_login.png)
![Dashboard (Landscape)](docs/mockups/04_dashboard_landscape.png)
![Create Capsule](docs/mockups/05_create_capsule.png)
![Profile](docs/mockups/06_profile.png)
```

**Option B: Figma link**

```md
**Figma:** https://github.com/TshwetsoMo/TimeLinked.git
```

**Option C: GIF demo**

```md
![App Demo](docs/mockups/timelink_demo.gif)
```

## 👨‍💻 Developer Contact

- **Name:** Your Name
- **Email:** [you@example.com](mailto:you@example.com)
- **Portfolio:** [https://your-portfolio-url.com](https://your-portfolio-url.com)
- **LinkedIn:** [https://www.linkedin.com/in/your-handle](https://www.linkedin.com/in/your-handle)
- **GitHub:** [https://github.com/your-handle](https://github.com/your-handle)
- **Twitter/X:** @yourhandle

Add your student number and module if this is for coursework.

---

## 🐛 Troubleshooting

- TypeScript "Cannot find module ..." - check relative paths and ensure files exist (`/navigation/AppNavigation.tsx`, `/theme/useTheme.ts`, etc.)
- Reanimated errors or blank screen - confirm Babel plugin and clear cache
- Auth "network request failed" - verify Firebase config and device connectivity
- Expo Go fails to connect - use `--tunnel` or disable VPN/firewall, remove legacy global CLI

---

## 📄 License

© 2025 TimeLink. Coursework and personal portfolio use.
Replace with your preferred license if open-sourcing.
