# FilmContract Development Build Guide

**Author:** John dee page jr  
**Copyright:** © 2026 John dee page jr

This guide will help you create a proper development build for FilmContract that supports all native features including push notifications.

---

## Why Development Build?

Expo Go has limitations - it doesn't support push notifications on Android (removed in SDK 53). A development build is a custom version of your app that includes all native modules and works like a real app.

---

## Prerequisites

1. **Expo Account** (free) - https://expo.dev/signup
2. **EAS CLI** - Install on your computer
3. **For Android:** No additional requirements
4. **For iOS:** Apple Developer account ($99/year) - only needed for physical devices

---

## Step-by-Step Instructions

### Step 1: Create an Expo Account

1. Go to https://expo.dev/signup
2. Create a free account
3. Remember your username

### Step 2: Install EAS CLI on Your Computer

If you have a computer, open terminal and run:

```bash
npm install -g eas-cli
```

### Step 3: Login to EAS

```bash
eas login
```

Enter your Expo account credentials.

### Step 4: Build for Android (APK)

Navigate to your project folder and run:

```bash
cd /path/to/filmcontract
eas build --platform android --profile development
```

This will:
- Upload your project to Expo's build servers
- Build an APK file (takes 10-20 minutes)
- Give you a download link for the APK

### Step 5: Install the APK

1. Download the APK from the link Expo provides
2. Transfer it to your Android phone
3. Open the APK file and install it
4. You may need to enable "Install from unknown sources" in settings

### Step 6: Run the Development Server

On your computer, start the development server:

```bash
cd /path/to/filmcontract
npx expo start --dev-client
```

### Step 7: Connect Your App

1. Open the FilmContract app on your phone (the one you just installed)
2. It will show a QR code scanner
3. Scan the QR code from your computer's terminal
4. The app will load with full native functionality!

---

## Building for iOS

For iOS devices, you need an Apple Developer account ($99/year).

```bash
eas build --platform ios --profile development
```

For iOS Simulator (free, Mac only):

```bash
eas build --platform ios --profile development --simulator
```

---

## Quick Commands Reference

| Command | Description |
|---------|-------------|
| `eas login` | Login to your Expo account |
| `eas build -p android --profile development` | Build Android development APK |
| `eas build -p ios --profile development` | Build iOS development app |
| `npx expo start --dev-client` | Start dev server for development build |

---

## Troubleshooting

**"Build failed"**
- Check your internet connection
- Make sure you're logged in (`eas whoami`)
- Try running `eas build` again

**"App won't connect to dev server"**
- Make sure your phone and computer are on the same WiFi network
- Try using the tunnel option: `npx expo start --dev-client --tunnel`

**"Push notifications not working"**
- Make sure you've granted notification permissions in the app
- Check that the push token is being registered correctly

---

## Need Help?

If you're on mobile and can't run these commands, you have a few options:

1. **Use a computer** - Borrow a friend's laptop for 30 minutes
2. **Use cloud services** - Services like Gitpod or GitHub Codespaces can run these commands in a browser
3. **Ask for help** - I can guide you through alternative methods

---

## What You Get

With a development build, you'll have:
- ✅ Full push notification support on Android
- ✅ All native features working
- ✅ Faster app performance
- ✅ Custom app icon and splash screen
- ✅ Can be shared with testers
