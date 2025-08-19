// Configuration file for environment variables
module.exports = {
  PORT: process.env.PORT || 3001,
  // MongoDB Atlas connection string
  MONGODB_URI:
    process.env.MONGODB_URI ||
    "mongodb+srv://oracles:eSSnfamcVMMkXZNr@yo.qofhg2y.mongodb.net/yoapp?retryWrites=true&w=majority",

  // Expo Push Notifications
  EXPO_ACCESS_TOKEN:
    process.env.EXPO_ACCESS_TOKEN || "0ebWMVBnvz1oGn5ZTcV5I7v10Q7CClIVL8S6qQd4",
  FCM_SERVER_KEY: process.env.FCM_SERVER_KEY || null,
};
