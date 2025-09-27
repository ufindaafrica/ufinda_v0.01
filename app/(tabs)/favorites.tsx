import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import {
    Button,
    Card,
    IconButton,
    Surface,
    Text,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { Listing } from '../../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

// Mock data - in a real app this would come from API
const mockListings: Listing[] = [
  {
    id: '1',
    title: 'Luxury Downtown Apartment',
    description: 'Beautiful apartment in the heart of the city with amazing views',
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
    ],
    amenities: ['WiFi', 'Kitchen', 'Air Conditioning', 'Gym'],
    bedrooms: 2,
    bathrooms: 2,
    maxGuests: 4,
    propertyType: 'apartment',
    landlordId: '2',
    rating: 4.8,
    reviewCount: 124,
    isAvailable: true,
    rules: ['No smoking', 'No pets', 'No parties'],
    checkInTime: '15:00',
    checkOutTime: '11:00',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: '2',
    title: 'Cozy Mountain Cabin',
    description: 'Escape to nature in this charming cabin surrounded by mountains',
    price: 85,
    currency: 'USD',
    location: {
      address: '456 Forest Lane',
      city: 'Aspen',
      state: 'CO',
      country: 'USA',
      coordinates: { lat: 39.1911, lng: -106.8175 },
    },
    images: [
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop',
    ],
    amenities: ['Fireplace', 'Hot Tub', 'Hiking Trails', 'WiFi'],
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    propertyType: 'house',
    landlordId: '2',
    rating: 4.9,
    reviewCount: 87,
    isAvailable: true,
    rules: ['No smoking', 'Quiet hours 10pm-8am'],
    checkInTime: '16:00',
    checkOutTime: '10:00',
    createdAt: '2023-01-02',
    updatedAt: '2023-01-02',
  },
];

export default function FavoritesScreen() {
  const { user } = useAuth();
  const { favorites, isFavorite, toggleFavorite, refreshFavorites } = useFavorites();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [favoriteListings, setFavoriteListings] = useState<Listing[]>([]);

  useEffect(() => {
    // Filter mock listings to show only favorited ones
    const favoritedListings = mockListings.filter(listing => isFavorite(listing.id));
    setFavoriteListings(favoritedListings);
  }, [favorites, isFavorite]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshFavorites();
    setRefreshing(false);
  };

  const renderFavoriteCard = (listing: Listing) => (
    <Card key={listing.id} style={styles.listingCard} mode="outlined">
      <Pressable onPress={() => router.push(`/listing/${listing.id}` as any)}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: listing.images[0] }}
            style={styles.listingImage}
            contentFit="cover"
          />
          <IconButton
            icon="heart"
            iconColor="#FF5A5F"
            containerColor="rgba(255,255,255,0.9)"
            size={20}
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              toggleFavorite(listing.id);
            }}
          />
        </View>
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium" style={styles.listingTitle} numberOfLines={1}>
            {listing.title}
          </Text>
          <Text variant="bodyMedium" style={styles.location} numberOfLines={1}>
            {listing.location.city}, {listing.location.state}
          </Text>
          <View style={styles.priceContainer}>
            <Text variant="bodyLarge" style={styles.price}>
              ${listing.price}
            </Text>
            <Text variant="bodyMedium" style={styles.priceUnit}> night</Text>
          </View>
        </Card.Content>
      </Pressable>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={0}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Wishlists
        </Text>
      </Surface>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {favoriteListings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="displaySmall" style={styles.emptyIcon}>
              💝
            </Text>
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              Create your first wishlist
            </Text>
            <Text variant="bodyLarge" style={styles.emptyDescription}>
              As you search, tap the heart icon to save your favorite places to stay or things to do.
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
        ) : (
          <>
            <View style={styles.statsContainer}>
              <Text variant="bodyLarge" style={styles.statsText}>
                {favoriteListings.length} saved place{favoriteListings.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.listingsContainer}>
              {favoriteListings.map(renderFavoriteCard)}
            </View>
          </>
        )}
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  statsText: {
    color: '#717171',
    fontWeight: '400',
  },
  listingsContainer: {
    paddingHorizontal: 20,
  },
  listingCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderColor: '#EBEBEB',
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  listingImage: {
    width: '100%',
    height: 180,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  cardContent: {
    padding: 16,
  },
  listingTitle: {
    fontWeight: '600',
    marginBottom: 4,
    color: '#222222',
  },
  location: {
    color: '#717171',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontWeight: '600',
    color: '#222222',
  },
  priceUnit: {
    color: '#717171',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
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