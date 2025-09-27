import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import {
    Avatar,
    Button,
    Card,
    Divider,
    List,
    Surface,
    Text,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleAuth = () => {
    if (user) {
      signOut();
    } else {
      router.push('/auth');
    }
  };

  const menuItems = [
    { title: 'Personal information', icon: 'account-outline', onPress: () => {} },
    { title: 'Payments and payouts', icon: 'credit-card-outline', onPress: () => {} },
    { title: 'Notifications', icon: 'bell-outline', onPress: () => {} },
    { title: 'Privacy and sharing', icon: 'shield-outline', onPress: () => {} },
    { title: 'Global preferences', icon: 'earth', onPress: () => {} },
    { title: 'Travel for work', icon: 'briefcase-outline', onPress: () => {} },
  ];

  const supportItems = [
    { title: 'Visit the Help Center', icon: 'help-circle-outline', onPress: () => {} },
    { title: 'Get help with a safety issue', icon: 'shield-alert-outline', onPress: () => {} },
    { title: 'Report a neighborhood concern', icon: 'flag-outline', onPress: () => {} },
  ];

  const legalItems = [
    { title: 'How Airbnb works', icon: 'information-outline', onPress: () => {} },
    { title: 'Terms of Service', icon: 'file-document-outline', onPress: () => {} },
    { title: 'Privacy Policy', icon: 'lock-outline', onPress: () => {} },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <Surface style={styles.header} elevation={0}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Profile
          </Text>
        </Surface>

        {/* User Section */}
        {user ? (
          <Card style={styles.userCard} mode="outlined">
            <Card.Content style={styles.userContent}>
              <Avatar.Text 
                size={64} 
                label={`${user.firstName[0]}${user.lastName[0]}`}
                style={styles.avatar}
                labelStyle={styles.avatarText}
              />
              <View style={styles.userInfo}>
                <Text variant="headlineSmall" style={styles.userName}>
                  {user.firstName} {user.lastName}
                </Text>
                <Text variant="bodyMedium" style={styles.userEmail}>
                  {user.email}
                </Text>
                <Text variant="bodySmall" style={styles.userType}>
                  {user.type === 'user' ? 'Guest' : 'Host'}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.guestCard} mode="outlined">
            <Card.Content style={styles.guestContent}>
              <Text variant="headlineSmall" style={styles.guestTitle}>
                Log in to start planning your next trip
              </Text>
              <Button
                mode="contained"
                onPress={handleAuth}
                style={styles.authButton}
                contentStyle={styles.buttonContent}
              >
                Log in
              </Button>
              <Text variant="bodySmall" style={styles.guestSubtext}>
                Don&apos;t have an account? Sign up
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Menu Sections */}
        <View style={styles.menuContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Account settings
          </Text>
          <Card style={styles.menuCard} mode="outlined">
            {menuItems.map((item, index) => (
              <View key={item.title}>
                <List.Item
                  title={item.title}
                  left={(props) => <List.Icon {...props} icon={item.icon} />}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                  onPress={item.onPress}
                  style={styles.listItem}
                  titleStyle={styles.listItemTitle}
                />
                {index < menuItems.length - 1 && <Divider />}
              </View>
            ))}
          </Card>
        </View>

        <View style={styles.menuContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Support
          </Text>
          <Card style={styles.menuCard} mode="outlined">
            {supportItems.map((item, index) => (
              <View key={item.title}>
                <List.Item
                  title={item.title}
                  left={(props) => <List.Icon {...props} icon={item.icon} />}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                  onPress={item.onPress}
                  style={styles.listItem}
                  titleStyle={styles.listItemTitle}
                />
                {index < supportItems.length - 1 && <Divider />}
              </View>
            ))}
          </Card>
        </View>

        <View style={styles.menuContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Legal
          </Text>
          <Card style={styles.menuCard} mode="outlined">
            {legalItems.map((item, index) => (
              <View key={item.title}>
                <List.Item
                  title={item.title}
                  left={(props) => <List.Icon {...props} icon={item.icon} />}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                  onPress={item.onPress}
                  style={styles.listItem}
                  titleStyle={styles.listItemTitle}
                />
                {index < legalItems.length - 1 && <Divider />}
              </View>
            ))}
          </Card>
        </View>

        {/* Sign out button for logged in users */}
        {user && (
          <View style={styles.signOutContainer}>
            <Button
              mode="outlined"
              onPress={handleAuth}
              style={styles.signOutButton}
              textColor="#717171"
            >
              Log out
            </Button>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
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
  userCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderColor: '#EBEBEB',
    backgroundColor: '#FFFFFF',
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    backgroundColor: '#FF5A5F',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: '600',
    color: '#222222',
    marginBottom: 4,
  },
  userEmail: {
    color: '#717171',
    marginBottom: 4,
  },
  userType: {
    color: '#717171',
    textTransform: 'capitalize',
  },
  guestCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderColor: '#EBEBEB',
    backgroundColor: '#FFFFFF',
  },
  guestContent: {
    padding: 20,
    alignItems: 'center',
  },
  guestTitle: {
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
    color: '#222222',
  },
  authButton: {
    backgroundColor: '#FF5A5F',
    marginBottom: 12,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 4,
    paddingHorizontal: 24,
  },
  guestSubtext: {
    color: '#717171',
    textAlign: 'center',
  },
  menuContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
    color: '#222222',
  },
  menuCard: {
    borderColor: '#EBEBEB',
    backgroundColor: '#FFFFFF',
  },
  listItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listItemTitle: {
    color: '#222222',
    fontWeight: '400',
  },
  signOutContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  signOutButton: {
    borderColor: '#DDDDDD',
  },
  bottomSpacing: {
    height: 24,
  },
});