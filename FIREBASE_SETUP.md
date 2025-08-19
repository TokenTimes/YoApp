# 🔥 Firebase Setup Guide for Yo App

Your Yo App now uses Firebase Cloud Messaging (FCM) for reliable push notifications that work even when the app is closed!

## 📋 Step 1: Create Firebase Project

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Click "Create a project"**
3. **Name your project**: `Yo App` (or any name you prefer)
4. **Enable Google Analytics** (optional)
5. **Create project**

## 📱 Step 2: Add Mobile Apps

### For Android:

1. **Click "Add app" → Android**
2. **Package name**: `com.yoapp.mobile` (from your app.json)
3. **Download `google-services.json`**
4. **Place it in**: `YoApp/android/app/google-services.json`

### For iOS:

1. **Click "Add app" → iOS**
2. **Bundle ID**: `com.yoapp.mobile` (from your app.json)
3. **Download `GoogleService-Info.plist`**
4. **Place it in**: `YoApp/ios/YoApp/GoogleService-Info.plist`

## 🔧 Step 3: Backend Configuration

1. **Go to Project Settings → Service Accounts**
2. **Click "Generate new private key"**
3. **Download the JSON file**
4. **Save it as**: `YoApp/server/firebase-service-account.json`

5. **Update `server/services/firebaseAdmin.js`**:

```javascript
// Uncomment and update this section:
admin.initializeApp({
  credential: admin.credential.cert(
    require("../firebase-service-account.json")
  ),
  projectId: "your-firebase-project-id", // Replace with your project ID
});
```

## 🎵 Step 4: Add Custom Sound Files

### For Android:

1. **Create directory**: `YoApp/android/app/src/main/res/raw/`
2. **Copy your sound file**: `yo_sound.wav` (no hyphens, lowercase)

### For iOS:

1. **Open Xcode project**: `YoApp/ios/YoApp.xcworkspace`
2. **Add sound file** to the project bundle: `yo-sound.wav`

## 🚀 Step 5: Test Your Setup

1. **Start the backend server**:

   ```bash
   cd server && npm start
   ```

2. **Start the Expo app**:

   ```bash
   npx expo start --clear
   ```

3. **Test notifications**:
   - Create two user accounts
   - Send Yos between them
   - Test with app in foreground, background, and closed

## ✅ Expected Behavior

### When App is Open (Foreground):

- ✅ **Toast notification** appears at the top
- ✅ **Custom sound** plays
- ✅ **Real-time update** in the app

### When App is in Background:

- ✅ **System notification** appears
- ✅ **Custom sound** plays
- ✅ **Tapping notification** opens the app

### When App is Closed:

- ✅ **Push notification** wakes up the device
- ✅ **Custom sound** plays
- ✅ **Tapping notification** launches the app

## 🐛 Troubleshooting

**No notifications received?**

- Check Firebase project configuration
- Verify service account key is correct
- Check device permissions for notifications
- Look at server logs for Firebase errors

**Sound not playing?**

- Verify sound files are in correct locations
- Check file names match exactly
- Ensure device volume is up and not in silent mode

**FCM token not generated?**

- Check Firebase project settings
- Verify app bundle/package IDs match
- Check device permissions

## 📁 File Structure After Setup

```
YoApp/
├── android/app/google-services.json          # Android config
├── ios/YoApp/GoogleService-Info.plist        # iOS config
├── android/app/src/main/res/raw/yo_sound.wav # Android sound
├── ios/YoApp/yo-sound.wav                    # iOS sound
└── server/firebase-service-account.json      # Backend config
```

## 🎉 You're All Set!

Your Yo App now has enterprise-grade push notifications with Firebase! Users will receive Yos with custom sounds whether the app is open, backgrounded, or completely closed.

**Need help?** Check the Firebase Console logs and your server console for detailed error messages.
