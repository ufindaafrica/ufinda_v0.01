import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    ScrollView,
    Share,
    StyleSheet,
    View,
} from 'react-native';
import {
    Avatar,
    Button,
    Card,
    Chip,
    Divider,
    IconButton,
    Surface,
    Text,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { Listing, Review } from '../../types';

const { width } = Dimensions.get('window');

// Mock data - in real app, this would be fetched based on listing ID
const mockListing: Listing = {
  id: '1',
  title: 'Luxury Downtown Apartment',
  description: `Experience the best of city living in this stunning downtown apartment. 

Located in the heart of the financial district, this beautifully furnished space offers breathtaking views of the city skyline. The apartment features modern amenities, high-end finishes, and everything you need for a comfortable stay.

Perfect for business travelers, couples, or anyone looking to explore the city. Walking distance to major attractions, restaurants, and public transportation.

The space includes a fully equipped kitchen, comfortable living area, and a dedicated workspace for remote work. High-speed WiFi throughout the apartment.`,
  price: 120,
  currency: 'USD',
  location: {
    address: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    coordinates: { lat: 37.7749, lng: -122.4194 },
  },
  images: [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&h=600&fit=crop',
  ],
  amenities: [
    'WiFi', 'Kitchen', 'Air Conditioning', 'Gym', 'Pool', 'Parking',
    'Balcony', 'Workspace', 'TV', 'Washing Machine'
  ],
  bedrooms: 2,
  bathrooms: 2,
  maxGuests: 4,
  propertyType: 'apartment',
  landlordId: 'landlord1',
  isAvailable: true,
  rating: 4.8,
  reviewCount: 24,
  rules: [
    'No smoking',
    'No pets',
    'No parties or events',
    'Check-in after 3:00 PM',
    'Check-out before 11:00 AM'
  ],
  checkInTime: '15:00',
  checkOutTime: '11:00',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockReviews: Review[] = [
  {
    id: '1',
    listingId: '1',
    userId: 'user1',
    rating: 5,
    comment: 'Amazing apartment with incredible views! The host was very responsive and the location is perfect for exploring the city.',
    createdAt: '2024-01-15',
    user: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      avatar: 'https://i.pravatar.cc/150?u=sarah',
    },
  },
  {
    id: '2',
    listingId: '1',
    userId: 'user2',
    rating: 4,
    comment: 'Great stay! The apartment was clean and well-equipped. Only minor issue was some noise from the street, but overall highly recommended.',
    createdAt: '2024-01-10',
    user: {
      firstName: 'Michael',
      lastName: 'Chen',
      avatar: 'https://i.pravatar.cc/150?u=michael',
    },
  },
];

export default function ListingDetailScreen() {
  const router = useRouter();
  // const params = useLocalSearchParams(); // Will use this when fetching dynamic listing
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // In real app, fetch listing by ID from params
  const listing = mockListing;
  const reviews = mockReviews;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this amazing place: ${listing.title} - $${listing.price}/night`,
        url: `ufinda://listing/${listing.id}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleBooking = () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    router.push(`/booking/${listing.id}`);
  };



  const renderImageCarousel = () => (
    <View style={styles.imageContainer}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentImageIndex(index);
        }}
      >
        {listing.images.map((image, index) => (
          <Image
            key={index}
            source={{ uri: image }}
            style={styles.image}
            contentFit="cover"
          />
        ))}
      </ScrollView>
      
      {/* Image indicators */}
      <View style={styles.imageIndicators}>
        {listing.images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              { opacity: index === currentImageIndex ? 1 : 0.5 }
            ]}
          />
        ))}
      </View>

      {/* Header buttons */}
      <View style={styles.headerButtons}>
        <IconButton
          icon="arrow-left"
          iconColor="#FFFFFF"
          style={styles.headerButton}
          onPress={() => router.back()}
        />
        <View style={styles.headerRightButtons}>
          <IconButton
            icon="share"
            iconColor="#FFFFFF"
            style={styles.headerButton}
            onPress={handleShare}
          />
          <IconButton
            icon={isFavorite(listing.id) ? "heart" : "heart-outline"}
            iconColor={isFavorite(listing.id) ? "#FF5A5F" : "#FFFFFF"}
            style={styles.headerButton}
            onPress={() => toggleFavorite(listing.id)}
          />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {renderImageCarousel()}

        <Surface style={styles.detailsContainer}>
          {/* Title and Rating */}
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <Text variant="headlineSmall" style={styles.title}>
                {listing.title}
              </Text>
              <View style={styles.ratingContainer}>
                <Text variant="titleMedium">★ {listing.rating}</Text>
                <Text variant="bodySmall" style={styles.reviewCount}>
                  ({listing.reviewCount})
                </Text>
              </View>
            </View>
            
            <Text variant="bodyLarge" style={styles.location}>
              {listing.location.address}, {listing.location.city}
            </Text>
            
            <View style={styles.propertyDetails}>
              <Text variant="bodyMedium">
                {listing.bedrooms} bedroom • {listing.bathrooms} bathroom • {listing.maxGuests} guests
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Description */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              About this place
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              {listing.description}
            </Text>
          </View>

          <Divider style={styles.divider} />

          {/* Amenities */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Amenities
            </Text>
            <View style={styles.amenitiesGrid}>
              {listing.amenities.map((amenity, index) => (
                <Chip key={index} style={styles.amenityChip} mode="outlined">
                  {amenity}
                </Chip>
              ))}
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* House Rules */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              House rules
            </Text>
            <View style={styles.rulesList}>
              {listing.rules.map((rule, index) => (
                <Text key={index} variant="bodyMedium" style={styles.rule}>
                  • {rule}
                </Text>
              ))}
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Reviews */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Reviews ({reviews.length})
            </Text>
            {reviews.map((review) => (
              <Card key={review.id} style={styles.reviewCard} mode="outlined">
                <Card.Content>
                  <View style={styles.reviewHeader}>
                    <Avatar.Image
                      size={40}
                      source={{ uri: review.user.avatar }}
                    />
                    <View style={styles.reviewUserInfo}>
                      <Text variant="titleSmall">
                        {review.user.firstName} {review.user.lastName}
                      </Text>
                      <Text variant="bodySmall" style={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.reviewRating}>
                      <Text variant="bodySmall">★ {review.rating}</Text>
                    </View>
                  </View>
                  <Text variant="bodyMedium" style={styles.reviewComment}>
                    {review.comment}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        </Surface>
      </ScrollView>

      {/* Booking Footer */}
      <Surface style={styles.bookingFooter} elevation={3}>
        <View style={styles.priceSection}>
          <Text variant="headlineSmall" style={styles.price}>
            ${listing.price}
          </Text>
          <Text variant="bodyMedium" style={styles.priceUnit}> / night</Text>
        </View>
        <Button
          mode="contained"
          onPress={handleBooking}
          style={styles.bookButton}
          contentStyle={styles.bookButtonContent}
        >
          Reserve
        </Button>
      </Surface>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  image: {
    width: width,
    height: 300,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
  },
  headerButtons: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerRightButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  detailsContainer: {
    flex: 1,
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: -16,
  },
  titleSection: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontWeight: 'bold',
    marginRight: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCount: {
    color: '#666',
    marginLeft: 4,
  },
  location: {
    color: '#666',
    marginBottom: 8,
  },
  propertyDetails: {
    marginTop: 4,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    lineHeight: 24,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  rulesList: {
    gap: 8,
  },
  rule: {
    lineHeight: 20,
  },
  reviewCard: {
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewUserInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reviewDate: {
    color: '#666',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewComment: {
    lineHeight: 20,
  },
  divider: {
    marginVertical: 8,
  },
  bookingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontWeight: 'bold',
    color: '#FF5A5F',
  },
  priceUnit: {
    color: '#666',
  },
  bookButton: {
    minWidth: 120,
  },
  bookButtonContent: {
    paddingVertical: 8,
  },
});