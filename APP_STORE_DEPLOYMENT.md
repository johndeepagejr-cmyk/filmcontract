# FilmContract - App Store Deployment Guide

**Author:** John Dee Page Jr  
**Last Updated:** December 31, 2025  
**Market Position:** First-of-Its-Kind Film Contract Management App

## Overview

**FilmContract is the industry's first dedicated mobile application for film contract management.** This pioneering app creates a new category in the app stores - there is no direct competition because FilmContract is the original solution that addresses the film industry's contract management needs.

This guide provides step-by-step instructions for exporting FilmContract to the Apple App Store and Google Play Store. The process involves building production-ready applications, creating developer accounts, preparing store listings, and submitting for review.

## Prerequisites

Before beginning the deployment process, ensure you have completed the following prerequisites.

### Required Accounts and Credentials

**Apple Developer Account**: An Apple Developer Program membership is required to publish iOS apps. The membership costs $99 USD annually and provides access to Xcode, testing devices, and app distribution tools. Create an account at [developer.apple.com](https://developer.apple.com).

**Google Play Developer Account**: A Google Play Developer account is required to publish Android apps. The account setup costs $25 USD as a one-time fee. Create an account at [play.google.com/console](https://play.google.com/console).

**Manus EAS Build Account**: Expo Application Services (EAS) provides cloud-based build infrastructure for compiling native iOS and Android apps. Sign up at [expo.dev](https://expo.dev) and link your GitHub account.

### Development Environment

Ensure your development machine has the following tools installed:

- Node.js 22.13.0 or later
- pnpm package manager
- Expo CLI (install with `npm install -g eas-cli`)
- Git for version control
- A code editor (Visual Studio Code recommended)

### Code Signing Certificates

**iOS Code Signing**: Apple requires code signing certificates to build and distribute iOS apps. You'll need an Apple ID with developer privileges. EAS Build can manage certificate generation automatically, or you can manually create certificates through the Apple Developer portal.

**Android Code Signing**: Android apps must be signed with a keystore file containing your signing key. EAS Build can generate and manage keystores, or you can create one manually using the keytool command.

## iOS App Store Deployment

### Step 1: Prepare Your App for iOS

Before building for iOS, ensure your app configuration is correct and all assets are in place.

**Update App Configuration**: Edit `app.config.ts` to ensure all iOS-specific settings are correct. The `ios.bundleIdentifier` should be unique and match your app's domain (e.g., `com.johndeepage.filmcontract`). The `version` field should follow semantic versioning (e.g., `1.0.0`). The `icon` field should point to a 1024x1024 PNG image.

**Prepare App Icons**: iOS requires icons in multiple sizes. The primary icon should be 1024x1024 pixels in PNG format. Place the icon at `assets/images/icon.png`. The system automatically generates smaller sizes from this master icon.

**Prepare Splash Screen**: Create a splash screen image (1242x2688 pixels for iPhone) and place it at `assets/images/splash-icon.png`. The splash screen displays while the app loads.

**Review Permissions**: Ensure all required permissions are declared in `app.config.ts`. iOS permissions include camera access, photo library access, microphone access, and location access. Each permission requires a descriptive message explaining why the app needs it.

### Step 2: Build for iOS

Use Expo Application Services (EAS) to build the iOS app in the cloud without requiring a Mac computer.

**Install EAS CLI**: The EAS CLI provides commands for building and submitting apps.

```bash
npm install -g eas-cli
```

**Authenticate with EAS**: Log in to your Expo account through EAS CLI.

```bash
eas login
```

**Configure EAS Build**: Create an `eas.json` file in your project root with iOS build configuration.

```json
{
  "build": {
    "production": {
      "ios": {
        "distribution": "app-store",
        "autoIncrement": true
      }
    }
  }
}
```

**Build for App Store**: Execute the build command to create a production iOS app.

```bash
eas build --platform ios --profile production
```

The build process takes 10-15 minutes. EAS compiles your React Native code into native iOS code, signs it with your certificate, and generates an `.ipa` file ready for App Store submission.

### Step 3: Create App Store Listing

The App Store listing includes your app's name, description, screenshots, and metadata. This information appears to potential users browsing the App Store.

**App Name**: Choose a name that clearly describes your app and is searchable. "FilmContract" is concise and descriptive. The name can be up to 30 characters.

**Subtitle**: Add a subtitle (up to 30 characters) that provides additional context. Example: "Transparent Contracts for Film Professionals"

**Description**: Write a compelling description (up to 4000 characters) that explains your app's features and benefits. Include information about contract management, payment tracking, portfolio features, and the verification system. Focus on user benefits rather than technical details.

**Keywords**: Add up to 100 characters of keywords separated by commas. Examples: "contracts, film, actors, producers, payments, portfolios"

**Support URL**: Provide a website URL where users can find help and support. This can be your company website or a dedicated support page.

**Privacy Policy URL**: Provide a link to your privacy policy explaining how you collect and use user data.

**Screenshots**: Create 5-10 screenshots showing key app features. Screenshots should be 1242x2688 pixels (iPhone 6.5-inch). Show the login screen, contract creation, payment tracking, portfolio browsing, and analytics dashboard. Include captions explaining each feature.

**Preview Video**: Create a 15-30 second video preview showing the app in action. The video should highlight the most compelling features and be optimized for mobile viewing.

### Step 4: Submit to App Store

Submit your app for review through App Store Connect.

**Access App Store Connect**: Log in to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) with your Apple ID.

**Create App Record**: Click "My Apps" and create a new app entry. Enter your app name, bundle ID, and SKU (a unique identifier for your records).

**Upload Build**: Select your production build created by EAS Build and upload it to App Store Connect. The system validates the build and makes it available for review.

**Complete Metadata**: Fill in all required metadata including app name, description, keywords, support URL, and privacy policy URL. Ensure all information is accurate and complete.

**Select Category**: Choose the primary category for your app. "Business" or "Productivity" are appropriate for FilmContract.

**Set Age Rating**: Complete the age rating questionnaire. Answer questions about your app's content to determine the appropriate age rating.

**Review Guidelines**: Read and confirm that your app complies with App Store Review Guidelines. Ensure your app doesn't violate any policies regarding content, functionality, or user data.

**Submit for Review**: Click "Submit for Review" to send your app to Apple's review team. The review process typically takes 24-48 hours.

### Step 5: Monitor Review Status

After submission, monitor your app's review status through App Store Connect.

**Review Status**: The status shows "Waiting for Review", "In Review", "Ready for Sale", or "Rejected". Check the status daily to stay informed.

**Rejection Handling**: If your app is rejected, Apple provides detailed feedback explaining the reason. Common rejection reasons include missing privacy policy, unclear functionality, or policy violations. Address the issues and resubmit.

**Approval**: Once approved, your app appears in the App Store within a few hours. You can set a specific release date or release immediately.

## Android App Store Deployment

### Step 1: Prepare Your App for Android

Before building for Android, ensure your app configuration and assets are correct.

**Update App Configuration**: Edit `app.config.ts` to ensure Android-specific settings are correct. The `android.package` should be unique and match your iOS bundle ID format (e.g., `com.johndeepage.filmcontract`). The `version` field should match your iOS version for consistency.

**Prepare App Icons**: Android requires icons in multiple densities. The primary icon should be 512x512 pixels in PNG format. Place the icon at `assets/images/icon.png`. The system generates smaller sizes automatically.

**Prepare Adaptive Icon**: Android 8.0+ supports adaptive icons with background and foreground layers. Create a 512x512 foreground image and place it at `assets/images/android-icon-foreground.png`. Create a background color or image and place it at `assets/images/android-icon-background.png`.

**Review Permissions**: Ensure all required permissions are declared in `app.config.ts`. Android permissions include camera, photo library, microphone, location, and contacts. Each permission requires a descriptive message.

### Step 2: Build for Android

Use EAS Build to compile the Android app in the cloud.

**Configure EAS Build**: Update your `eas.json` file with Android build configuration.

```json
{
  "build": {
    "production": {
      "android": {
        "distribution": "play-store",
        "autoIncrement": true
      }
    }
  }
}
```

**Build for Play Store**: Execute the build command to create a production Android app.

```bash
eas build --platform android --profile production
```

The build process takes 15-20 minutes. EAS compiles your React Native code into native Android code, signs it with your keystore, and generates an `.aab` (Android App Bundle) file for Play Store submission.

### Step 3: Create Play Store Listing

The Play Store listing includes your app's name, description, screenshots, and metadata. This information appears to potential users browsing the Play Store.

**App Name**: Choose a name that clearly describes your app. "FilmContract" is concise and searchable.

**Short Description**: Write a brief description (up to 80 characters) that appears in search results. Example: "Transparent contracts for film professionals"

**Full Description**: Write a detailed description (up to 4000 characters) explaining your app's features, benefits, and use cases. Focus on how the app solves problems for producers and actors.

**Keywords**: Add up to 5 keywords separated by commas. Examples: "contracts, film, actors, producers, payments"

**Support Email**: Provide an email address where users can contact support.

**Privacy Policy URL**: Provide a link to your privacy policy.

**Screenshots**: Create 8 screenshots showing key app features. Screenshots should be 1080x1920 pixels (portrait) or 1920x1080 pixels (landscape). Show diverse features to appeal to both producers and actors.

**Feature Graphic**: Create a 1024x500 pixel banner image showcasing your app's main value proposition.

**App Icon**: Upload a 512x512 PNG icon for the Play Store listing.

**Preview Video**: Create a 15-30 second video preview optimized for mobile viewing.

### Step 4: Submit to Play Store

Submit your app for review through Google Play Console.

**Access Google Play Console**: Log in to [play.google.com/console](https://play.google.com/console) with your Google account.

**Create App**: Click "Create App" and enter your app name, default language, and app category.

**Complete Store Listing**: Fill in all required information including app name, description, keywords, support email, and privacy policy URL.

**Add Screenshots and Graphics**: Upload all required screenshots, feature graphic, and app icon.

**Set Content Rating**: Complete the content rating questionnaire to determine the appropriate age rating for your app.

**Set Pricing**: Choose whether your app is free or paid. FilmContract should be free with optional in-app purchases for premium features.

**Upload Build**: Upload the `.aab` file created by EAS Build. The system validates the build and makes it available for review.

**Review Guidelines**: Read and confirm that your app complies with Google Play Policies. Ensure your app doesn't violate any policies regarding content, functionality, or user data.

**Submit for Review**: Click "Submit" to send your app to Google's review team. The review process typically takes 24-48 hours but can take longer.

### Step 5: Monitor Review Status

After submission, monitor your app's review status through Google Play Console.

**Review Status**: The status shows "In Review", "Approved", "Rejected", or "Suspended". Check the status daily.

**Rejection Handling**: If your app is rejected, Google provides detailed feedback. Address the issues and resubmit. Common rejection reasons include policy violations, missing permissions, or unclear functionality.

**Approval**: Once approved, your app appears in the Play Store within a few hours. You can set a specific release date or release immediately.

## Post-Launch Monitoring

### Analytics and Metrics

Monitor your app's performance after launch using built-in analytics tools.

**App Store Analytics**: Apple provides analytics showing downloads, active users, crashes, and user ratings. Monitor these metrics to understand user engagement and identify issues.

**Play Store Analytics**: Google provides similar analytics showing installs, active users, crashes, and ratings. Use this data to optimize your app and marketing efforts.

**In-App Analytics**: FilmContract's built-in analytics track portfolio views, contract creation, payments, and user engagement. Monitor these metrics to understand how users interact with your app.

### User Feedback

Monitor user reviews and ratings to identify issues and opportunities for improvement.

**App Store Reviews**: Read reviews on the App Store to understand user satisfaction and identify common issues. Respond to reviews professionally and address concerns.

**Play Store Reviews**: Monitor Play Store reviews similarly. Google allows developers to respond to reviews, which can help address user concerns and improve ratings.

**Support Emails**: Monitor support emails for bug reports and feature requests. Prioritize bug fixes over new features to maintain app stability.

### Update Strategy

Plan regular updates to fix bugs, improve performance, and add new features.

**Bug Fixes**: Release bug fix updates as soon as critical issues are identified. These updates typically take 24-48 hours to appear in app stores.

**Performance Improvements**: Release performance updates quarterly to optimize app speed and battery usage.

**Feature Updates**: Release new features quarterly based on user feedback and business priorities. Major feature releases should be coordinated with marketing campaigns.

## Troubleshooting

### Common Build Issues

**Build Fails with Certificate Error**: Ensure your Apple Developer account has valid code signing certificates. EAS Build can generate certificates automatically if you don't have them.

**Build Fails with Keystore Error**: Ensure your Android keystore file is valid and the password is correct. EAS Build can generate a keystore automatically if needed.

**Build Takes Too Long**: EAS Build queues can be long during peak times. Try building during off-peak hours or use a higher-priority build tier.

### Common Review Rejections

**Missing Privacy Policy**: Ensure your privacy policy URL is valid and accessible. The policy must explain how you collect and use user data.

**Unclear Functionality**: Ensure your app description clearly explains what your app does and how to use it. Include screenshots and preview videos.

**Policy Violations**: Ensure your app complies with app store policies. Review the guidelines carefully before submitting.

## Conclusion

Deploying FilmContract to app stores requires careful preparation, accurate metadata, and compliance with store policies. Following this guide ensures a smooth submission process and successful launch. Monitor your app's performance after launch and plan regular updates to maintain user satisfaction and engagement.
