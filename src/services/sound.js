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

      // Load the custom Yo sound - try M4A format first (the actual format)
      console.log("🎵 Loading yo-sound.m4a file...");
      let sound;
      try {
        const result = await Audio.Sound.createAsync(
          require("../../assets/sounds/yo-sound.m4a"),
          {
            shouldPlay: false,
            isLooping: false,
            volume: 1.0,
          },
          (status) => {
            console.log("🎵 M4A Sound loading status:", status);
          }
        );
        sound = result.sound;
        console.log("✅ M4A sound loaded successfully");
      } catch (m4aError) {
        console.log("❌ M4A failed, trying WAV format:", m4aError.message);
        // Fallback to WAV format
        const result = await Audio.Sound.createAsync(
          require("../../assets/sounds/yo-sound.wav"),
          {
            shouldPlay: false,
            isLooping: false,
            volume: 1.0,
          },
          (status) => {
            console.log("🎵 WAV Sound loading status:", status);
          }
        );
        sound = result.sound;
        console.log("✅ WAV sound loaded successfully");
      }

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
      console.log("🔊 Attempting to play Yo sound...");

      if (!this.isLoaded) {
        console.log("Sound not loaded, initializing...");
        await this.initializeSound();
      }

      // Try to play custom sound first
      if (this.sound) {
        try {
          await this.sound.replayAsync();
          console.log("✅ Custom Yo sound played successfully");
        } catch (soundError) {
          console.error("❌ Error playing custom sound:", soundError);
          // Fallback to vibration if sound playback fails
          console.log("Using vibration fallback due to sound error");
          Vibration.vibrate([0, 200, 100, 200]);
        }
      } else {
        // Fallback to vibration if sound failed to load
        console.log("🔊 Using vibration fallback (no sound loaded)");
        Vibration.vibrate([0, 200, 100, 200]);
      }

      // Always add a quick vibration for better user experience
      setTimeout(() => {
        Vibration.vibrate([0, 100]);
      }, 100);
    } catch (error) {
      console.error("❌ Error in playYoSound:", error);
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
