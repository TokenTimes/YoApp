# Quick Setup Guide

## 🚀 Get Started in 5 Minutes

### 1. Prerequisites

- Install [Node.js](https://nodejs.org/) (v14+)
- Install [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g @expo/cli`
- Install **Expo Go** app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### 2. Database Setup (Choose One)

#### Option A: MongoDB Atlas (Recommended - Free)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Get your connection string
4. Edit `server/config.js` and replace the MONGODB_URI with your Atlas connection string

#### Option B: Local MongoDB

1. Install [MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. Start MongoDB: `mongod`
3. The app will automatically connect to `mongodb://localhost:27017/yoapp`

### 3. Install & Run

```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Start the development environment
./start-dev.sh
```

### 4. Test on Your Phone

1. Open **Expo Go** app on your phone
2. Scan the QR code from your terminal
3. The app will load automatically!

### 5. Invite Friends

- Share the same QR code with friends
- They can install Expo Go and scan the same code
- Start sending Yos to each other!

## 🔧 Configuration for Physical Devices

If testing on a real device and the app can't connect to the server:

1. Find your computer's IP address:

   ```bash
   # macOS/Linux
   ifconfig | grep "inet "

   # Windows
   ipconfig
   ```

2. Update the API endpoints in:
   - `src/services/api.js` - Replace `localhost` with your IP
   - `src/services/socket.js` - Replace `localhost` with your IP

Example:

```javascript
// Change from:
const API_BASE_URL = "http://localhost:3000/api";

// To (using your IP):
// const API_BASE_URL = "http://192.168.1.100:3000/api";
```

## 🎯 Quick Test

1. Create a user account with any username
2. Ask a friend to create an account on the same network
3. You should see each other in the friends list
4. Tap "Yo!" to send a message
5. The recipient should get a notification with sound/vibration!

## 🐛 Troubleshooting

**"Network request failed"**

- Make sure backend server is running (`npm run server-dev`)
- Check your IP address configuration for physical devices

**"Can't connect to database"**

- Verify MongoDB is running (local) or Atlas connection string is correct
- Check the server logs for detailed error messages

**No notifications**

- Make sure you granted notification permissions
- Test on a physical device (simulators don't support push notifications)

Need help? Check the full [README.md](README.md) for detailed instructions!
