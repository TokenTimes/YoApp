// services/sound.js
import { Audio } from "expo-av";
import { Vibration } from "react-native";

// Create a single instance of the sound object to be reused
let yoSoundObject = null;
let isInitialized = false;
let initializationAttempts = 0;
const MAX_INITIALIZATION_ATTEMPTS = 3;

const SoundService = {
  // A dedicated method to pre-load the sound when the app starts
  initializeSound: async () => {
    // Don't try to initialize if already successfully initialized
    if (isInitialized && yoSoundObject) {
      console.log("✅ Sound already initialized");
      return true;
    }

    // Don't retry if we've exceeded max attempts
    if (initializationAttempts >= MAX_INITIALIZATION_ATTEMPTS) {
      console.warn(
        `⚠️ Max sound initialization attempts (${MAX_INITIALIZATION_ATTEMPTS}) reached. Sound will use vibration fallback.`
      );
      return false;
    }

    initializationAttempts++;
    console.log(
      `🎵 Initializing sound (attempt ${initializationAttempts}/${MAX_INITIALIZATION_ATTEMPTS})...`
    );

    try {
      // Set audio mode for playback - simplified to avoid enum issues
      // This configuration should work for playing Yo sounds
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true, // Essential: allows sound in silent mode
        shouldDuckAndroid: true,
        staysActiveInBackground: false, // Don't need background audio
      });

      console.log("🎵 Loading yo-sound file...");
      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/sounds/yo-sound.m4a"), // Use the correct path and file type
        { shouldPlay: false, isLooping: false, volume: 1.0 }
      );

      yoSoundObject = sound;
      isInitialized = true;
      console.log("✅ Yo sound loaded successfully.");
      return true;
    } catch (error) {
      console.error(
        `❌ Failed to load sound file (attempt ${initializationAttempts}):`,
        error
      );
      yoSoundObject = null;
      isInitialized = false;

      // If we haven't reached max attempts, we'll try again next time
      if (initializationAttempts < MAX_INITIALIZATION_ATTEMPTS) {
        console.log(
          `⏳ Will retry sound initialization. Attempts remaining: ${
            MAX_INITIALIZATION_ATTEMPTS - initializationAttempts
          }`
        );
      }

      return false;
    }
  },

  // The method to play the sound or fallback to vibration
  playYoSound: async () => {
    try {
      // If the sound object is loaded, try to play it
      if (isInitialized && yoSoundObject) {
        await yoSoundObject.replayAsync();
        console.log("✅ Custom Yo sound played successfully");
        return true;
      } else {
        // If not initialized but haven't reached max attempts, try to initialize
        if (initializationAttempts < MAX_INITIALIZATION_ATTEMPTS) {
          console.log("🔄 Sound not initialized, attempting to initialize...");
          const initialized = await SoundService.initializeSound();
          if (initialized && yoSoundObject) {
            await yoSoundObject.replayAsync();
            console.log("✅ Custom Yo sound played successfully after retry");
            return true;
          }
        }

        // Fallback to vibration if sound is not loaded
        console.warn("🔊 Sound not available, using vibration fallback.");
        Vibration.vibrate([0, 200]);
        return false;
      }
    } catch (error) {
      console.error("❌ Error playing sound:", error);
      // Fallback to vibration if there's an issue during playback
      Vibration.vibrate([0, 200]);
      return false;
    }
  },

  // Cleanup method to unload the sound object
  cleanup: async () => {
    try {
      if (yoSoundObject) {
        console.log("🧹 Unloading sound object...");
        await yoSoundObject.unloadAsync();
        yoSoundObject = null;
        isInitialized = false;
        initializationAttempts = 0; // Reset attempts for next session
        console.log("✅ Sound service cleaned up.");
      }
    } catch (error) {
      console.error("❌ Error cleaning up sound:", error);
      // Still reset the state even if cleanup fails
      yoSoundObject = null;
      isInitialized = false;
      initializationAttempts = 0;
    }
  },

  // Method to check if sound is available
  isSoundAvailable: () => {
    return isInitialized && yoSoundObject !== null;
  },

  // Method to get initialization status
  getStatus: () => {
    return {
      isInitialized,
      attempts: initializationAttempts,
      maxAttempts: MAX_INITIALIZATION_ATTEMPTS,
      canRetry: initializationAttempts < MAX_INITIALIZATION_ATTEMPTS,
    };
  },
};

export default SoundService;
