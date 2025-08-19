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

### 4. Update API Configuration

If your backend is running on a different IP or port, update the API configuration:

```javascript
// src/services/api.js
const API_BASE_URL = "http://YOUR_IP_ADDRESS:3000/api";

// src/services/socket.js
this.serverURL = "http://YOUR_IP_ADDRESS:3000";
```

**Important**: When testing on a physical device, replace `localhost` with your computer's IP address.

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
