import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import {
    Button,
    Card,
    Divider,
    IconButton,
    SegmentedButtons,
    Surface,
    Text,
    TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
//k listing data - in real app, fetch by ID
const mockListing = {
  id: '1',
  title: 'Luxury Downtown Apartment',
  price: 120,
  location: 'San Francisco, CA',
  image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
  maxGuests: 4,
};

export default function BookingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  // const params = useLocalSearchParams(); // Will use when implementing dynamic listing fetching
  
  const [checkInDate] = useState(new Date());
  const [checkOutDate] = useState(new Date(Date.now() + 86400000)); // Tomorrow
  const [guests, setGuests] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isBooking, setIsBooking] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'Please log in to book this listing.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => router.back(),
          },
          {
            text: 'Log In',
            onPress: () => router.push('/auth'),
          },
        ]
      );
    }
  }, [user, router]);

  const listing = mockListing;
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));
  const subtotal = nights * listing.price;
  const serviceFee = Math.round(subtotal * 0.1);
  const taxes = Math.round(subtotal * 0.08);
  const total = subtotal + serviceFee + taxes;

  const handleBooking = async () => {
    if (checkInDate >= checkOutDate) {
      Alert.alert('Invalid Dates', 'Check-out date must be after check-in date.');
      return;
    }

    if (guests < 1 || guests > listing.maxGuests) {
      Alert.alert('Invalid Guests', `Number of guests must be between 1 and ${listing.maxGuests}.`);
      return;
    }

    setIsBooking(true);
    
    try {
      // Simulate booking API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Booking Confirmed!',
        `Your reservation for ${listing.title} has been confirmed. You will receive a confirmation email shortly.`,
        [
          {
            text: 'OK',
            onPress: () => router.push('/home'),
          },
        ]
      );
    } catch {
      Alert.alert('Booking Failed', 'Unable to complete your booking. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={1}>
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => router.back()}
          />
          <Text variant="titleLarge" style={styles.headerTitle}>
            Confirm and pay
          </Text>
          <View style={{ width: 48 }} />
        </View>
      </Surface>

      <ScrollView style={styles.content}>
        {/* Login Required Card */}
        {!user && (
          <Card style={[styles.card, styles.loginCard]}>
            <Card.Content style={styles.loginContent}>
              <Text variant="titleMedium" style={styles.loginTitle}>
                Log in to complete your booking
              </Text>
              <Text variant="bodyMedium" style={styles.loginDescription}>
                You'll need to create an account or log in to reserve this place.
              </Text>
              <Button
                mode="contained"
                onPress={() => router.push('/auth')}
                style={styles.loginButton}
                contentStyle={styles.buttonContent}
              >
                Log in or sign up
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Listing Summary */}
        <Card style={styles.card}>
          <View style={styles.listingSummary}>
            <Image
              source={{ uri: listing.image }}
              style={styles.listingImage}
              contentFit="cover"
            />
            <View style={styles.listingInfo}>
              <Text variant="titleMedium" style={styles.listingTitle}>
                {listing.title}
              </Text>
              <Text variant="bodyMedium" style={styles.listingLocation}>
                {listing.location}
              </Text>
              <Text variant="titleSmall" style={styles.listingPrice}>
                ${listing.price} / night
              </Text>
            </View>
          </View>
        </Card>

        {/* Trip Details */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Your trip
            </Text>

            {/* Dates */}
            <View style={styles.dateSection}>
              <View style={styles.dateRow}>
                <Text variant="titleSmall">Check-in</Text>
                <Button
                  mode="outlined"
                  onPress={() => console.log('Open date picker')}
                  style={styles.dateButton}
                >
                  {formatDate(checkInDate)}
                </Button>
              </View>
              
              <View style={styles.dateRow}>
                <Text variant="titleSmall">Check-out</Text>
                <Button
                  mode="outlined"
                  onPress={() => console.log('Open date picker')}
                  style={styles.dateButton}
                >
                  {formatDate(checkOutDate)}
                </Button>
              </View>
            </View>

            {/* Guests */}
            <View style={styles.guestsSection}>
              <Text variant="titleSmall" style={styles.guestsLabel}>
                Guests (max {listing.maxGuests})
              </Text>
              <View style={styles.guestsControls}>
                <IconButton
                  icon="minus"
                  mode="outlined"
                  size={20}
                  disabled={guests <= 1}
                  onPress={() => setGuests(Math.max(1, guests - 1))}
                />
                <Text variant="titleMedium" style={styles.guestsCount}>
                  {guests}
                </Text>
                <IconButton
                  icon="plus"
                  mode="outlined"
                  size={20}
                  disabled={guests >= listing.maxGuests}
                  onPress={() => setGuests(Math.min(listing.maxGuests, guests + 1))}
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Special Requests */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Special requests
            </Text>
            <TextInput
              mode="outlined"
              placeholder="Any special requests or requirements?"
              value={specialRequests}
              onChangeText={setSpecialRequests}
              multiline
              numberOfLines={3}
            />
          </Card.Content>
        </Card>

        {/* Payment Method */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Payment method
            </Text>
            <SegmentedButtons
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              buttons={[
                { value: 'card', label: 'Credit Card' },
                { value: 'paypal', label: 'PayPal' },
                { value: 'apple', label: 'Apple Pay' },
              ]}
            />
            <Text variant="bodySmall" style={styles.paymentNote}>
              * This is a demo. No actual payment will be processed.
            </Text>
          </Card.Content>
        </Card>

        {/* Price Breakdown */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Price details
            </Text>
            
            <View style={styles.priceRow}>
              <Text variant="bodyMedium">
                ${listing.price} × {nights} nights
              </Text>
              <Text variant="bodyMedium">${subtotal}</Text>
            </View>
            
            <View style={styles.priceRow}>
              <Text variant="bodyMedium">Service fee</Text>
              <Text variant="bodyMedium">${serviceFee}</Text>
            </View>
            
            <View style={styles.priceRow}>
              <Text variant="bodyMedium">Taxes</Text>
              <Text variant="bodyMedium">${taxes}</Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.priceRow}>
              <Text variant="titleMedium" style={styles.totalLabel}>
                Total
              </Text>
              <Text variant="titleMedium" style={styles.totalAmount}>
                ${total}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Terms */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="bodySmall" style={styles.terms}>
              By selecting the button below, I agree to the Host&apos;s House Rules, 
              Ground rules for guests, Ufinda&apos;s Rebooking and Refund Policy, 
              and that Ufinda can charge my payment method if I&apos;m responsible 
              for damage.
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Booking Button */}
      <Surface style={styles.footer} elevation={3}>
        <Button
          mode="contained"
          onPress={handleBooking}
          loading={isBooking}
          disabled={isBooking}
          style={styles.bookButton}
          contentStyle={styles.bookButtonContent}
        >
          {isBooking ? 'Processing...' : `Confirm and pay $${total}`}
        </Button>
      </Surface>

      {/* Note: Date pickers would be implemented with a proper date picker library in production */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFFFFF',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  listingSummary: {
    flexDirection: 'row',
    padding: 16,
  },
  listingImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  listingInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  listingTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  listingLocation: {
    color: '#666',
    marginBottom: 4,
  },
  listingPrice: {
    color: '#FF5A5F',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dateSection: {
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateButton: {
    minWidth: 120,
  },
  guestsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guestsLabel: {
    flex: 1,
  },
  guestsControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guestsCount: {
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: 'center',
  },
  paymentNote: {
    marginTop: 12,
    fontStyle: 'italic',
    color: '#666',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalAmount: {
    fontWeight: 'bold',
    color: '#FF5A5F',
  },
  terms: {
    lineHeight: 18,
    color: '#666',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  bookButton: {
    width: '100%',
  },
  bookButtonContent: {
    paddingVertical: 12,
  },
  loginCard: {
    backgroundColor: '#FFF8E7',
    borderColor: '#FFD60A',
    borderWidth: 1,
  },
  loginContent: {
    padding: 20,
    alignItems: 'center',
  },
  loginTitle: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
    color: '#222222',
  },
  loginDescription: {
    textAlign: 'center',
    color: '#717171',
    marginBottom: 20,
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: '#FF5A5F',
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 4,
    paddingHorizontal: 24,
  },
});