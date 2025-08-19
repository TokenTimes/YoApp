# 🔊 How to Add Your Custom Yo Sound

## Step 1: Add Your .wav File

1. **Copy your .wav file** to this exact location:

   ```
   YoApp/assets/sounds/yo-sound.wav
   ```

2. **Make sure the file is named exactly**: `yo-sound.wav`

## Step 2: That's It!

The app is already configured to use your custom sound file. The sound service will:

- ✅ **Load your custom .wav file** automatically
- ✅ **Play it when Yos are received**
- ✅ **Fall back to vibration** if the sound fails to load
- ✅ **Add vibration** for better user experience

## 🎵 Sound Requirements

Your .wav file should be:

- **Format**: WAV or MP3 (WAV recommended)
- **Duration**: 1-3 seconds (short and snappy)
- **Size**: Under 1MB for faster loading
- **Quality**: 44.1kHz, 16-bit is perfect

## 🔧 Testing Your Sound

1. **Place your .wav file** in `assets/sounds/yo-sound.wav`
2. **Restart the Expo development server**:
   ```bash
   npx expo start --clear
   ```
3. **Test on your device** by having someone send you a Yo
4. **Check the console logs** - you should see "Custom Yo sound loaded successfully"

## 🐛 Troubleshooting

**Sound not playing?**

- Check the file path is exactly: `assets/sounds/yo-sound.wav`
- Make sure the file format is supported (.wav, .mp3, .m4a)
- Check the Expo console for error messages
- The app will fall back to vibration if sound fails

**Still having issues?**

- Try converting your audio file to .wav format
- Reduce the file size if it's too large
- Check that your device volume is up and not on silent mode

## 📱 Device Testing

- **iOS**: Sounds work on physical devices and simulators
- **Android**: Sounds work on physical devices and emulators
- **Silent Mode**: The app is configured to play sounds even in silent mode (iOS)

Your custom sound will now play every time someone sends you a Yo! 🎉
