<!-- REPLACE ALL THE [USERNAME] TEXT WITH YOUR GITHUB PROFILE NAME & THE [PROJECTNAME] WITH THE NAME OF YOUR GITHUB PROJECT -->

<!-- Repository Information & Links-->
<br />

![GitHub repo size](https://img.shields.io/github/repo-size/TshwetsoMo/TimeLinked?color=%23000000)
![GitHub watchers](https://img.shields.io/github/watchers/TshwetsoMo/TimeLinked?color=%23000000)
![GitHub language count](https://img.shields.io/github/languages/count/TshwetsoMo/TimeLinked?color=%23000000)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/TshwetsoMo/TimeLinked?color=%23000000)
[![LinkedIn][linkedin-shield]][linkedin-url]
[![Instagram][instagram-shield]][instagram-url]
[![Behance][behance-shield]][behance-url]

<!-- HEADER SECTION -->
<h5 align="center" style="padding:0;margin:0;">Tshwetso K. Mokgatlhe</h5>
<h5 align="center" style="padding:0;margin:0;">Student Number: 221411</h5>
<h6 align="center">DV300 | Interaction Development | 2025</h6>
</br>
<p align="center">

  <a href="https://github.com/TshwetsoMo/TimeLinked">
    <img src="assets/logo.png" alt="Logo" width="140" height="140">
  </a>
  
  <h3 align="center">TimeLink</h3>

  <p align="center">
    Stay connected, across time and memory. A cross-platform journaling & time capsule app.<br>
      <a href="https://github.com/TshwetsoMo/TimeLinked"><strong>Explore the docs »</strong></a>
   <br />
   <br />
   <a href="https://drive.google.com/file/d/1XFYxnq2RMVfamPVBhObwc-1NxEM8piwt/view?usp=drive_link">View Demo</a>
    ·
    <a href="https://github.com/TshwetsoMo/TimeLinked/issues">Report Bug</a>
    ·
    <a href="https://github.com/TshwetsoMo/TimeLinked/issues">Request Feature</a>
</p>

---

## Table of Contents
* [About the Project](#about-the-project)
  * [Project Description](#project-description)
  * [Built With](#built-with)
* [Getting Started](#getting-started)
  * [Prerequisites](#prerequisites)
  * [How to Install](#how-to-install)
* [Features and Functionality](#features-and-functionality)
* [Concept Process](#concept-process)
* [Development Process](#development-process)
* [Final Outcome](#final-outcome)
* [Roadmap](#roadmap)
* [Contributing](#contributing)
* [License](#license)
* [Contact](#contact)
* [Acknowledgements](#acknowledgements)

---

## 🧠 About the Project
![image1][image1]

### Project Description
**TimeLink** is a cross-platform (iOS & Android) React Native app built with **Expo** and **TypeScript**.  
It helps users preserve connections across time through **Daily Journals** and **Scheduled Time Capsules**—messages that resurface at meaningful future moments.  
The UI has **landscape affinity**, and the backend uses **Firebase** for authentication, storage, and real-time data.

### Built With
* [Expo SDK 54](https://expo.dev)
* [React Native 0.81](https://reactnative.dev/)
* [TypeScript 5](https://www.typescriptlang.org/)
* [Firebase Auth & Firestore](https://firebase.google.com/)
* [Reanimated 4 + Moti](https://docs.expo.dev/versions/latest/sdk/reanimated/)
* [React Navigation v7](https://reactnavigation.org/)
* [Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js LTS (≥ 18)
- Expo Go app (Android/iOS)
- A configured Firebase project with **Auth**, **Firestore**, and **Storage**

### How to Install
```bash
# Clone repository
git clone https://github.com/TshwetsoMo/TimeLinked.git
cd TimeLinked
```

# Install dependencies
```
npm install
```

# Start Expo server (tunnel recommended)
```
npx expo start --tunnel
Scan the QR code in Expo Go.
If LAN fails, continue using --tunnel.
```

## ⚙️ Features and Functionality

- **Welcome / Onboarding** – seamless access to Register & Login  
- **Authentication** – Firebase Email/Password with persistent sessions  
- **Dashboard** – landscape-optimised hub for Journal, Inbox & Capsules  
- **Daily Journal** – CRUD entries with moods and timestamps  
- **Time Capsules** – messages scheduled for future delivery  
- **Profile** – editable display name + photo, theme toggle  
- **Micro-interactions** – Reanimated + Moti  
- **Accessibility** – clear contrast, large touch targets, readable typography  

---

## 🧩 Development Process

### Implementation
- **Stack:** Expo + TypeScript + Firebase + Reanimated 4  
- **Architecture:** Component-based modular design with Auth Context  
- **Data:** Firestore collections (`users`, `journalEntries`, `timeCapsules`)  
- **Auth Persistence:** AsyncStorage via `getReactNativePersistence`  
- **Storage:** Profile images handled with `expo-image-picker`  

### Highlights
- Migration to Expo SDK 54 / RN 0.81  
- Reanimated 4 + Worklets for smoother UI motion  
- Firestore rules structured for secure per-user data access  

### Challenges
- Handling RN version mismatch with Expo Go  
- Managing async Firestore reads + state without race conditions  
- Maintaining performance in landscape layouts  

### Future Implementation
- Push notifications for capsule deliveries  
- Cloud Functions for timed release server-side  
- Social “memory threads” for shared capsules  

---

## 🎨 Final Outcome

### Mockups
<!-- Drop your PNGs into assets/mockups/ with these exact names or update the refs below -->
![Welcome](assets/mockups/01_welcome.png)
![Register](assets/mockups/02_register.png)
![Login](assets/mockups/03_login.png)
![Dashboard (Landscape)](assets/mockups/04_dashboard_landscape.png)
![Create Capsule](assets/mockups/05_create_capsule.png)
![Create Journal](assets/mockups/06_create_journal.png)
![Profile](assets/mockups/07_profile.png)
![Dark Mode](assets/mockups/08_dark_mode.png)
![Dark Mode Dashboard](assets/mockups/09_darkmode_dash.png)

### Video Demonstration
[View Demonstration](https://drive.google.com/file/d/1XFYxnq2RMVfamPVBhObwc-1NxEM8piwt/view?usp=drive_link)

---

## 🗺 Roadmap
See the [open issues](https://github.com/TshwetsoMo/TimeLinked/issues) for proposed features and known issues.

---

## 📜 License
© 2025 TimeLink. Coursework and personal portfolio use.

---

## 📫 Contact
- **Tshwetso K. Mokgatlhe** – [tshwetsomokgatlhe98@gmail.com](mailto:tshwetsomokgatlhe98@gmail.com)  
- **GitHub:** [github.com/TshwetsoMo/TimeLinked](https://github.com/TshwetsoMo/TimeLinked)  
- **LinkedIn:** [linkedin.com/in/tshwetsomokgatlhe](https://linkedin.com/in/tshwetsomokgatlhe)  
- **Instagram:** [@tshwetsomo](https://www.instagram.com/tshwetsomo/)  

---

## 🙏 Acknowledgements
- [Expo Docs](https://docs.expo.dev/)
- [Firebase Docs](https://firebase.google.com/docs)
- [React Navigation](https://reactnavigation.org/)
- [Open Window DV300 Lecturers](https://www.openwindow.co.za/)
- [Moti Animations](https://moti.fyi/)
- [Reanimated 4](https://docs.swmansion.com/react-native-reanimated/)
