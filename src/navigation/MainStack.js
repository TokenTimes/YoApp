import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import MainScreen from "../screens/MainScreen";
import FriendRequestsScreen from "../screens/FriendRequestsScreen";
import FriendSearchScreen from "../screens/FriendSearchScreen";
import UserSearchScreen from "../screens/UserSearchScreen";

const Stack = createStackNavigator();

const MainStack = ({ user, onLogout }) => {
  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="Main">
        {(props) => <MainScreen {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen name="FriendRequests" component={FriendRequestsScreen} />
      <Stack.Screen name="FriendSearch" component={FriendSearchScreen} />
      <Stack.Screen name="UserSearch" component={UserSearchScreen} />
    </Stack.Navigator>
  );
};

export default MainStack;
