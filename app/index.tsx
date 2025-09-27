import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Always redirect to tabs - no authentication required for browsing
    const timer = setTimeout(() => {
      router.replace('/(tabs)/explore');
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF5A5F" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
