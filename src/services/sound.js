// Sound service using Expo AV
import { Audio } from "expo-av";
import { Vibration } from "react-native";

class SoundService {
  constructor() {
    this.sound = null;
    this.isLoaded = false;
  }

  async initializeSound() {
    try {
      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Load the custom Yo sound
      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/sounds/yo-sound.wav"),
        {
          shouldPlay: false,
          isLooping: false,
          volume: 1.0,
        }
      );

      this.sound = sound;
      this.isLoaded = true;
      console.log("Custom Yo sound loaded successfully");
    } catch (error) {
      console.error(
        "Error loading custom sound, falling back to vibration:",
        error
      );
      this.isLoaded = true; // Still mark as loaded so we can use vibration fallback
    }
  }

  async playYoSound() {
    try {
      if (!this.isLoaded) {
        await this.initializeSound();
      }

      // Try to play custom sound first
      if (this.sound) {
        await this.sound.replayAsync();
        console.log("Custom Yo sound played");
      } else {
        // Fallback to vibration if sound failed to load
        console.log("Using vibration fallback");
        Vibration.vibrate([0, 200, 100, 200]);
      }

      // Always add vibration for better user experience
      Vibration.vibrate([0, 100]);
    } catch (error) {
      console.error("Error playing Yo sound:", error);
      // Fallback to vibration
      Vibration.vibrate([0, 200, 100, 200]);
    }
  }

  async playNotificationSound() {
    try {
      // Simple vibration for notification
      Vibration.vibrate(500);
      console.log("Notification sound played");
    } catch (error) {
      console.error("Error playing notification sound:", error);
    }
  }

  async cleanup() {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }
      this.isLoaded = false;
      console.log("Sound service cleaned up");
    } catch (error) {
      console.error("Error cleaning up sound:", error);
    }
  }
}

export default new SoundService();
