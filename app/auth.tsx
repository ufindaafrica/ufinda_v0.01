import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import {
    Button,
    Divider,
    SegmentedButtons,
    Snackbar,
    Surface,
    Text,
    TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [userType, setUserType] = useState<'user' | 'landlord'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (mode === 'signup' && (!firstName || !lastName)) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let success = false;
      
      if (mode === 'signin') {
        success = await signIn(email, password, userType);
      } else {
        success = await signUp({
          email,
          password,
          firstName,
          lastName,
          type: userType,
        });
      }

      if (success) {
        router.replace('/(tabs)/explore');
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons name="home-variant" size={48} color="#FF5A5F" />
            </View>
            <Text variant="headlineLarge" style={styles.title}>
              Welcome to Ufinda
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              {mode === 'signin' ? 'Sign in to continue' : 'Create your account'}
            </Text>
          </View>

          {/* Main Form Card */}
          <Surface style={styles.formContainer} elevation={2}>
            {/* Mode Toggle */}
            <View style={styles.modeToggleContainer}>
              <Pressable
                style={[styles.modeButton, mode === 'signin' && styles.activeModeButton]}
                onPress={() => setMode('signin')}
              >
                <Text style={[styles.modeButtonText, mode === 'signin' && styles.activeModeButtonText]}>
                  Sign In
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modeButton, mode === 'signup' && styles.activeModeButton]}
                onPress={() => setMode('signup')}
              >
                <Text style={[styles.modeButtonText, mode === 'signup' && styles.activeModeButtonText]}>
                  Sign Up
                </Text>
              </Pressable>
            </View>

            {/* User Type Selection */}
            <View style={styles.userTypeContainer}>
              <Text variant="titleSmall" style={styles.userTypeLabel}>
                I&apos;m a:
              </Text>
              <SegmentedButtons
                value={userType}
                onValueChange={(value) => setUserType(value as 'user' | 'landlord')}
                buttons={[
                  { 
                    value: 'user', 
                    label: 'Guest',
                    icon: 'account',
                  },
                  { 
                    value: 'landlord', 
                    label: 'Host',
                    icon: 'home-account',
                  },
                ]}
                style={styles.userTypeToggle}
              />
            </View>

            {/* Form Fields */}
            <View style={styles.formFields}>
              {mode === 'signup' && (
                <View style={styles.nameRow}>
                  <TextInput
                    label="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                    mode="outlined"
                    style={[styles.input, styles.nameInput]}
                    outlineColor="#E0E0E0"
                    activeOutlineColor="#FF5A5F"
                  />
                  <TextInput
                    label="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                    mode="outlined"
                    style={[styles.input, styles.nameInput]}
                    outlineColor="#E0E0E0"
                    activeOutlineColor="#FF5A5F"
                  />
                </View>
              )}

              <TextInput
                label="Email address"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                outlineColor="#E0E0E0"
                activeOutlineColor="#FF5A5F"
                left={<TextInput.Icon icon="email-outline" />}
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
                outlineColor="#E0E0E0"
                activeOutlineColor="#FF5A5F"
                left={<TextInput.Icon icon="lock-outline" />}
              />
              {mode === 'signup' && (
                <View style={styles.passwordHints}>
                  <Text style={styles.passwordHintTitle}>Password must contain:</Text>
                  <Text style={styles.passwordHint}>• At least 8 characters</Text>
                  <Text style={styles.passwordHint}>• One uppercase letter</Text>
                  <Text style={styles.passwordHint}>• One lowercase letter</Text>
                  <Text style={styles.passwordHint}>• One number</Text>
                  <Text style={styles.passwordHint}>• One special character</Text>
                </View>
              )}
            </View>

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
              labelStyle={styles.submitButtonLabel}
            >
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>

            {/* Future Google Login Placeholder */}
            <View style={styles.socialContainer}>
              <View style={styles.dividerContainer}>
                <Divider style={styles.divider} />
                <Text style={styles.dividerText}>or</Text>
                <Divider style={styles.divider} />
              </View>
              
              <Button
                mode="outlined"
                icon="google"
                disabled
                style={styles.googleButton}
                contentStyle={styles.googleButtonContent}
                labelStyle={styles.googleButtonLabel}
              >
                Continue with Google
              </Button>
              <Text style={styles.comingSoonText}>Coming soon</Text>
            </View>
          </Surface>

          {/* Demo Credentials */}
          <Surface style={styles.demoCard} elevation={0}>
            <Text style={styles.demoTitle}>
              🎯 Demo Credentials
            </Text>
            <Text style={styles.demoText}>
              Guest: demo@user.com / password
            </Text>
            <Text style={styles.demoText}>
              Host: demo@host.com / password
            </Text>
          </Surface>
        </ScrollView>

        <Snackbar
          visible={!!error}
          onDismiss={() => setError('')}
          duration={4000}
        >
          {error}
        </Snackbar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#FFF5F5',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    color: '#222222',
  },
  subtitle: {
    color: '#717171',
    textAlign: 'center',
    fontSize: 16,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeModeButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#717171',
  },
  activeModeButtonText: {
    color: '#222222',
  },
  userTypeContainer: {
    marginBottom: 24,
  },
  userTypeLabel: {
    marginBottom: 12,
    color: '#222222',
    fontWeight: '600',
  },
  userTypeToggle: {
    // Uses default SegmentedButtons styling
  },
  formFields: {
    marginBottom: 24,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameInput: {
    flex: 1,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#FF5A5F',
    borderRadius: 8,
    marginBottom: 24,
  },
  submitButtonContent: {
    paddingVertical: 12,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  socialContainer: {
    alignItems: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  divider: {
    flex: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#717171',
    fontSize: 14,
  },
  googleButton: {
    borderColor: '#E0E0E0',
    borderRadius: 8,
    width: width - 96,
    opacity: 0.6,
  },
  googleButtonContent: {
    paddingVertical: 12,
  },
  googleButtonLabel: {
    color: '#717171',
    fontSize: 16,
  },
  comingSoonText: {
    marginTop: 8,
    fontSize: 12,
    color: '#B0B0B0',
    fontStyle: 'italic',
  },
  demoCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  demoTitle: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#0369A1',
    fontSize: 14,
  },
  demoText: {
    color: '#0369A1',
    marginBottom: 4,
    fontSize: 13,
  },
  passwordHints: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF5A5F',
  },
  passwordHintTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 4,
  },
  passwordHint: {
    fontSize: 11,
    color: '#717171',
    lineHeight: 16,
  },
});