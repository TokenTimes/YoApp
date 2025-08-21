# Yo App - React Native with Expo

A full-stack mobile application inspired by the classic "Yo" app. Send instant "Yo" messages to your friends with real-time notifications, sound effects, and beautiful UI.

## 🚀 Features

- **Real-time messaging** with Socket.IO
- **Push notifications** with sound and vibration
- **MongoDB integration** for user data persistence
- **Auto-login** with local storage
- **Online/offline status** indicators
- **Modern UI** with smooth animations
- **Cross-platform** (iOS & Android)

## 📱 Technology Stack

### Frontend (React Native + Expo)

- **React Native** with Expo framework
- **Socket.IO Client** for real-time communication
- **Expo Notifications** for push notifications
- **Expo AV** for sound effects
- **AsyncStorage** for local data persistence
- **Custom UI components** with modern design

### Backend (Node.js)

- **Express.js** server
- **Socket.IO** for real-time communication
- **MongoDB** with Mongoose ODM
- **CORS** enabled for cross-origin requests

## 🛠️ Prerequisites

Before running this app, make sure you have:

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g @expo/cli`
- **Expo Go app** installed on your mobile device
- **MongoDB** (local installation or MongoDB Atlas)

## 📦 Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Navigate to the project directory
cd YoApp

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Configure MongoDB

#### Option A: Local MongoDB

```bash
# Make sure MongoDB is running locally on port 27017
# The app will connect to: mongodb://localhost:27017/yoapp
```

#### Option B: MongoDB Atlas (Recommended)

1. Create a free MongoDB Atlas account at https://www.mongodb.com/atlas
2. Create a new cluster
3. Get your connection string
4. Update `server/config.js` with your MongoDB Atlas URI:

```javascript
module.exports = {
  PORT: process.env.PORT || 3000,
  MONGODB_URI:
    "mongodb+srv://<username>:<password>@<cluster>.mongodb.net/yoapp?retryWrites=true&w=majority",
};
```

### 3. Start the Backend Server

```bash
# From the project root
cd server
npm start

# Or for development with auto-restart:
npm run dev
```

The server will start on `http://localhost:3000`

### 4. Network Configuration (Automatic)

The app automatically detects your network configuration:

- **Development**: Uses Expo's development server IP automatically
- **Physical Device**: Detects your computer's IP address
- **Android Emulator**: Uses `10.0.2.2` to reach host machine
- **iOS Simulator**: Uses `localhost`

**No manual configuration needed!** The app works anywhere automatically.

For production deployment, use:

```bash
node scripts/set-production-url.js https://your-server.herokuapp.com
```

## 📱 Running on Mobile Devices

### iOS (iPhone/iPad)

1. **Install Expo Go** from the App Store
2. **Start the Expo development server**:
   ```bash
   npx expo start
   ```
3. **Scan the QR code** with your iPhone camera or Expo Go app
4. The app will load automatically on your device

### Android

1. **Install Expo Go** from Google Play Store
2. **Start the Expo development server**:
   ```bash
   npx expo start
   ```
3. **Scan the QR code** with the Expo Go app
4. The app will load automatically on your device

### Testing on Real Devices

```bash
# Start the development server with tunnel (recommended for real devices)
npx expo start --tunnel

# Or start with your local network IP
npx expo start --lan
```

## 🔔 Custom Notification Sound Testing

### ⚠️ Important Limitation

Custom sounds **do not work in Expo Go**. You must build a custom development client using `expo-dev-client`, or a full standalone app via `eas build`.

### 🎵 Testing Custom Sounds on Real Devices

#### ✅ iOS (Custom Dev Client or Standalone)

1. **Build a Development Client** (for local testing):

   ```bash
   # Build and run on iOS device/simulator
   npm run build:ios

   # Or start dev client mode
   npm run dev-client
   ```

2. **Get Your Push Token** (add this temporarily to your app):

   ```javascript
   // Add to MainScreen.js for testing
   import * as Notifications from "expo-notifications";

   const token = await Notifications.getExpoPushTokenAsync();
   console.log("Push Token:", token.data);
   ```

3. **Test Custom Sound via cURL**:

   ```bash
   curl -X POST https://exp.host/--/api/v2/push/send \
     -H "Content-Type: application/json" \
     -d '{
       "to": "ExponentPushToken[YOUR_TOKEN_HERE]",
       "sound": "yo_sound.caf",
       "title": "🔊 Custom Sound Test",
       "body": "This should play your custom Yo sound!",
       "priority": "high"
     }'
   ```

4. **Expected Behavior**:
   - ✅ **Foreground**: Custom sound plays
   - ✅ **Background**: Custom sound plays
   - ✅ **Terminated**: Custom sound plays

#### 📱 Android (Managed Workflow)

⚠️ **Note**: Expo Notifications on Android (managed) do not support custom sounds out-of-the-box.

1. **Test Default Sound**:

   ```bash
   curl -X POST https://exp.host/--/api/v2/push/send \
     -H "Content-Type: application/json" \
     -d '{
       "to": "ExponentPushToken[YOUR_TOKEN_HERE]",
       "title": "📱 Android Test",
       "body": "This will use the default system sound",
       "priority": "high"
     }'
   ```

2. **For Full Android Sound Customization**:
   - Must eject to bare workflow
   - Place `yo_sound.caf` in `android/app/src/main/res/raw/`
   - Use `"sound": "yo_sound"` in FCM payload

### 🛠️ Development Testing Commands

```bash
# Start development server with dev client
npm run dev-client

# Build for iOS testing (requires Apple Developer account)
npm run build:ios

# Build for Android testing
npm run build:android

# Start backend server for push testing
npm run server-dev
```

### 📋 Testing Checklist

- [ ] Custom sound file is at `assets/notifications/yo_sound.caf`
- [ ] `app.json` includes sound in `notification.sounds` array
- [ ] iOS `UIBackgroundModes` includes `remote-notification`
- [ ] Built custom dev client (not using Expo Go)
- [ ] Obtained push token from device
- [ ] Tested foreground notifications
- [ ] Tested background notifications
- [ ] Tested terminated state notifications

## 🔧 Development Commands

### Frontend Commands

```bash
# Start Expo development server
npx expo start

# Start for iOS simulator
npx expo start --ios

# Start for Android emulator
npx expo start --android

# Start for web
npx expo start --web

# Clear Expo cache
npx expo start --clear
```

### Backend Commands

```bash
cd server

# Start production server
npm start

# Start development server with auto-restart
npm run dev

# Check server health
curl http://localhost:3000/api/health
```

## 🎯 How to Use

1. **Launch the app** on your device using Expo Go
2. **Enter a username** on the login screen
3. **Grant notification permissions** when prompted
4. **View your friends list** on the main screen
5. **Tap "Yo!" button** next to any friend to send them a Yo
6. **Receive real-time notifications** when friends send you Yos
7. **See online/offline status** of your friends
8. **Pull down to refresh** the friends list

## 🚀 Deployment

### Deploy Backend to Production

1. **Heroku Deployment**:

   ```bash
   cd server

   # Create Heroku app
   heroku create your-yo-app-backend

   # Set environment variables
   heroku config:set MONGODB_URI="your-mongodb-atlas-uri"

   # Deploy
   git add .
   git commit -m "Deploy backend"
   git push heroku main
   ```

2. **Update frontend configuration** with production URL:
   ```javascript
   // src/services/api.js
   const API_BASE_URL = "https://your-yo-app-backend.herokuapp.com/api";
   ```

### Build Mobile App for Production

```bash
# Build for iOS
npx eas build --platform ios

# Build for Android
npx eas build --platform android

# Build for both platforms
npx eas build --platform all
```

## 🔐 Environment Variables

### Backend (.env file or environment)

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/yoapp
```

## 🐛 Troubleshooting

### Common Issues

1. **"Network request failed"**

   - Make sure the backend server is running
   - Check that you're using the correct IP address (not localhost) for physical devices
   - Ensure your device and computer are on the same network

2. **"Unable to connect to database"**

   - Verify MongoDB is running (local) or connection string is correct (Atlas)
   - Check network connectivity
   - Ensure database credentials are correct

3. **Notifications not working**

   - Make sure you've granted notification permissions
   - Test on a physical device (notifications don't work in simulators)
   - Check that Expo push notifications are properly configured

4. **Socket connection issues**
   - Verify the backend server is running
   - Check that Socket.IO is properly initialized
   - Ensure firewall isn't blocking the connection

### Development Tips

- **Use your computer's IP address** instead of localhost when testing on physical devices
- **Check the Expo DevTools** for detailed error messages
- **Use the Expo Go app logs** for debugging on device
- **Test push notifications only on physical devices**

## 📁 Project Structure

```
YoApp/
├── App.js                          # Main app component
├── app.json                        # Expo configuration
├── package.json                    # Frontend dependencies
├── assets/                         # Images, sounds, fonts
├── src/
│   ├── components/                 # Reusable UI components
│   ├── screens/
│   │   ├── LoginScreen.js         # User authentication
│   │   └── MainScreen.js          # Friends list & Yo functionality
│   ├── services/
│   │   ├── api.js                 # REST API communication
│   │   ├── socket.js              # Socket.IO real-time communication
│   │   ├── notifications.js       # Push notifications
│   │   └── sound.js               # Sound effects & vibration
│   └── utils/
│       └── storage.js             # Local data persistence
└── server/                        # Backend Node.js application
    ├── index.js                   # Main server file
    ├── config.js                  # Configuration
    ├── package.json               # Backend dependencies
    └── models/
        └── User.js                # MongoDB user model
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🎉 Acknowledgments

- Inspired by the original Yo app
- Built with React Native and Expo
- Uses MongoDB for data persistence
- Real-time communication powered by Socket.IO

---

**Happy Yo-ing! 🎉**

For questions or support, please open an issue in the repository.
