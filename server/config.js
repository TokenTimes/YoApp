// Configuration file for environment variables
module.exports = {
  PORT: process.env.PORT || 3001,
  // MongoDB Atlas connection string
  MONGODB_URI:
    process.env.MONGODB_URI ||
    "mongodb+srv://oracles:eSSnfamcVMMkXZNr@yo.qofhg2y.mongodb.net/yoapp?retryWrites=true&w=majority",
};
