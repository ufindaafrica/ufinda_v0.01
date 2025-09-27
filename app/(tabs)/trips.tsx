import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Surface, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

export default function TripsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Surface style={styles.header} elevation={0}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Trips
        </Text>
      </Surface>

      <View style={styles.content}>
        {!user ? (
          <View style={styles.emptyContainer}>
            <Text variant="displaySmall" style={styles.emptyIcon}>
              ✈️
            </Text>
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              No trips booked...yet!
            </Text>
            <Text variant="bodyLarge" style={styles.emptyDescription}>
              Time to dust off your bags and start planning your next adventure
            </Text>
            <Button
              mode="contained"
              onPress={() => router.push('/(tabs)/explore')}
              style={styles.exploreButton}
              contentStyle={styles.buttonContent}
            >
              Start searching
            </Button>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text variant="displaySmall" style={styles.emptyIcon}>
              ✈️
            </Text>
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              No trips yet
            </Text>
            <Text variant="bodyLarge" style={styles.emptyDescription}>
              When you're ready to plan your next trip, we're here to help.
            </Text>
            <Button
              mode="contained"
              onPress={() => router.push('/(tabs)/explore')}
              style={styles.exploreButton}
              contentStyle={styles.buttonContent}
            >
              Start exploring
            </Button>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontWeight: '600',
    color: '#222222',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 24,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
    color: '#222222',
  },
  emptyDescription: {
    textAlign: 'center',
    color: '#717171',
    marginBottom: 32,
    lineHeight: 24,
  },
  exploreButton: {
    backgroundColor: '#FF5A5F',
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
});