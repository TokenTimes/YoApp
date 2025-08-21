import React, { useRef } from "react";
import {
  View,
  Text,
  Animated,
  Vibration,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");

const SwipeableRow = ({ item, children, onRemove, onBlock }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const actionButtonWidth = 80;
  const totalActionWidth = actionButtonWidth * 2; // Two buttons
  const threshold = 100;

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    {
      useNativeDriver: true,
      listener: (event) => {
        const { translationX } = event.nativeEvent;
        // Smooth resistance for better feel
        if (translationX > 0) {
          // Right swipe resistance - allow some movement but with resistance
          translateX.setValue(translationX * 0.3);
        } else if (translationX < -totalActionWidth - 30) {
          // Left swipe with slight overscroll allowed
          const overscroll =
            Math.abs(translationX + totalActionWidth + 30) * 0.1;
          translateX.setValue(-totalActionWidth - 30 - overscroll);
        }
      },
    }
  );

  const onHandlerStateChange = (event) => {
    const { state, translationX, velocityX } = event.nativeEvent;

    if (state === State.BEGAN) {
      Vibration.vibrate(5); // Subtle feedback on start
    }

    if (state === State.END) {
      const shouldShowActions =
        Math.abs(translationX) > threshold ||
        (Math.abs(velocityX) > 1000 && translationX < -30);

      if (translationX < -20 && shouldShowActions) {
        // Show action buttons
        Animated.spring(translateX, {
          toValue: -totalActionWidth,
          tension: 150,
          friction: 8,
          useNativeDriver: true,
        }).start();
      } else {
        // Smooth snap back animation
        Animated.spring(translateX, {
          toValue: 0,
          tension: 150,
          friction: 10,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  // Dynamic opacity and scale for action buttons
  const actionOpacity = translateX.interpolate({
    inputRange: [-totalActionWidth - 20, -30, 0],
    outputRange: [1, 0.7, 0],
    extrapolate: "clamp",
  });

  const actionScale = translateX.interpolate({
    inputRange: [-totalActionWidth, -20, 0],
    outputRange: [1, 0.9, 0.7],
    extrapolate: "clamp",
  });

  const handleBlockPress = () => {
    Vibration.vibrate(30);
    // Animate back to closed position
    Animated.spring(translateX, {
      toValue: 0,
      tension: 150,
      friction: 10,
      useNativeDriver: true,
    }).start();
    onBlock?.(item.username);
  };

  const handleDeletePress = () => {
    Vibration.vibrate([50, 30, 50]);
    // Animate to fully off screen
    Animated.timing(translateX, {
      toValue: -screenWidth,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onRemove?.(item.username);
    });
  };

  return (
    <View style={styles.container}>
      {/* Action Buttons Background */}
      <Animated.View
        style={[
          styles.actionsContainer,
          {
            opacity: actionOpacity,
            transform: [{ scale: actionScale }],
          },
        ]}>
        {/* Block Button */}
        <TouchableOpacity
          style={styles.blockButton}
          onPress={handleBlockPress}
          activeOpacity={0.7}>
          <Ionicons name="ban-outline" size={20} color="#fff" />
          <Text style={styles.actionText}>Block</Text>
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeletePress}
          activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Swipeable Content */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-5, 5]}
        failOffsetY={[-10, 10]}>
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ translateX }],
            },
          ]}>
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = {
  container: {
    position: "relative",
    marginBottom: 12,
    backgroundColor: "transparent",
  },
  actionsContainer: {
    position: "absolute",
    right: 15,
    top: 10,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    width: 160, // actionButtonWidth * 2
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  blockButton: {
    backgroundColor: "#ef4444", // Red background for block
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    height: "100%",
  },
  deleteButton: {
    backgroundColor: "#1f2937", // Black background for delete
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    height: "100%",
  },
  actionText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  content: {
    backgroundColor: "transparent",
    borderRadius: 16,
  },
};

export default SwipeableRow;
