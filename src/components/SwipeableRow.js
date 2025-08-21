import React, { useRef } from "react";
import { View, Text, Animated, Vibration, Dimensions } from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");

const SwipeableRow = ({ item, children, onRemove }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteWidth = 100;
  const threshold = 80;

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
        } else if (translationX < -deleteWidth - 30) {
          // Left swipe with slight overscroll allowed
          const overscroll = Math.abs(translationX + deleteWidth + 30) * 0.1;
          translateX.setValue(-deleteWidth - 30 - overscroll);
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
      const shouldDelete =
        Math.abs(translationX) > threshold ||
        (Math.abs(velocityX) > 1000 && translationX < -30);

      if (translationX < -20 && shouldDelete) {
        // Delete animation with stronger vibration
        Vibration.vibrate([50, 30, 50]); // Pattern vibration
        Animated.timing(translateX, {
          toValue: -screenWidth,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          onRemove?.(item.username);
        });
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

  // Dynamic opacity and scale for delete button
  const deleteOpacity = translateX.interpolate({
    inputRange: [-deleteWidth - 20, -30, 0],
    outputRange: [1, 0.7, 0],
    extrapolate: "clamp",
  });

  const deleteScale = translateX.interpolate({
    inputRange: [-deleteWidth, -20, 0],
    outputRange: [1, 0.9, 0.7],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      {/* Delete Background */}
      <Animated.View
        style={[
          styles.deleteBackground,
          {
            opacity: deleteOpacity,
            transform: [{ scale: deleteScale }],
          },
        ]}>
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.deleteText}>Remove</Text>
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
  deleteBackground: {
    position: "absolute",
    right: 15,
    top: 10,
    bottom: 10,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  deleteText: {
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
