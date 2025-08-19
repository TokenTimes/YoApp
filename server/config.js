// Configuration file for environment variables
module.exports = {
  PORT: process.env.PORT || 3001,
  // MongoDB Atlas connection string with your actual cluster
  MONGODB_URI:
    process.env.MONGODB_URI ||
    "mongodb+srv://oracles:eSSnfamcVMMkXZNr@yo.qofhg2y.mongodb.net/yoapp?retryWrites=true&w=majority",
  // Local fallback (commented out)
  // MONGODB_URI: "mongodb://localhost:27017/yoapp",
};
