import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function TabLayout() {
  const { user } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF5A5F',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="magnify" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Wishlists',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="heart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bag-suitcase-outline" size={size} color={color} />
          ),
          tabBarBadge: user ? undefined : undefined, // Could add notification badges
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="message-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons 
              name={user ? "account-circle" : "account-circle-outline"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}