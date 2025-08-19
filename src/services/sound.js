// services/sound.js
import { Audio } from "expo-av";
import { Vibration } from "react-native";

// Create a single instance of the sound object to be reused
let yoSoundObject = null;

const SoundService = {
  // A dedicated method to pre-load the sound when the app starts
  initializeSound: async () => {
    try {
      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });

      console.log("🎵 Loading yo-sound file...");
      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/sounds/yo-sound.m4a"), // Use the correct path and file type
        { shouldPlay: false, isLooping: false, volume: 1.0 }
      );
      yoSoundObject = sound;
      console.log("✅ Yo sound loaded successfully.");
    } catch (error) {
      console.error("❌ Failed to load sound file:", error);
      yoSoundObject = null; // Ensure the sound object is null if loading fails
    }
  },

  // The method to play the sound or fallback to vibration
  playYoSound: async () => {
    try {
      // If the sound object is loaded, try to play it
      if (yoSoundObject) {
        await yoSoundObject.replayAsync();
        console.log("✅ Custom Yo sound played successfully");
      } else {
        // Fallback to vibration if sound is not loaded
        console.warn("🔊 Sound not loaded, using vibration fallback.");
        Vibration.vibrate([0, 200]);
      }
    } catch (error) {
      console.error("❌ Error playing sound:", error);
      // Fallback to vibration if there's an issue during playback
      Vibration.vibrate([0, 200]);
    }
  },

  // Cleanup method to unload the sound object
  cleanup: async () => {
    try {
      if (yoSoundObject) {
        console.log("Unloading sound object...");
        await yoSoundObject.unloadAsync();
        yoSoundObject = null;
        console.log("Sound service cleaned up.");
      }
    } catch (error) {
      console.error("❌ Error cleaning up sound:", error);
    }
  },
};

export default SoundService;
