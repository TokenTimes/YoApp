#!/usr/bin/env node

// Script to set production API URL
const fs = require('fs');
const path = require('path');

const appJsonPath = path.join(__dirname, '..', 'app.json');
const appJson = require(appJsonPath);

// Get API URL from command line argument
const apiUrl = process.argv[2];

if (!apiUrl) {
  console.log('Usage: node scripts/set-production-url.js <API_URL>');
  console.log('Example: node scripts/set-production-url.js https://your-server.herokuapp.com');
  process.exit(1);
}

// Update the API URL
appJson.expo.extra.API_URL = apiUrl;

// Write back to app.json
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

console.log(`✅ Production API URL set to: ${apiUrl}`);
console.log('📱 Rebuild your app to apply changes');
