// Configuration file for environment variables
module.exports = {
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/yoapp",
  // You can replace this with your MongoDB Atlas connection string
  // MONGODB_URI: 'mongodb+srv://<username>:<password>@<cluster>.mongodb.net/yoapp?retryWrites=true&w=majority'
};

