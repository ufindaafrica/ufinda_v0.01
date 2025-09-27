import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
  Chip,
  IconButton,
  Searchbar,
  Surface,
  Text,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { Listing } from '../../types';
import * as Sentry from '@sentry/react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

// Mock data for listings - in a real app this would come from API
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
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
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
  {
    id: '3',
    title: 'Modern Beach House',
    description: 'Wake up to ocean views in this stunning beachfront property',
    price: 200,
    currency: 'USD',
    location: {
      address: '789 Ocean Drive',
      city: 'Malibu',
      state: 'CA',
      country: 'USA',
      coordinates: { lat: 34.0259, lng: -118.7798 },
    },
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
    ],
    amenities: ['Beach Access', 'Pool', 'WiFi', 'Kitchen', 'Parking'],
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 6,
    propertyType: 'house',
    landlordId: '3',
    rating: 4.7,
    reviewCount: 203,
    isAvailable: true,
    rules: ['No smoking', 'No loud music after 9pm'],
    checkInTime: '15:00',
    checkOutTime: '11:00',
    createdAt: '2023-01-03',
    updatedAt: '2023-01-03',
  }
];

export default function ExploreScreen() {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const router = useRouter();
  const [listings] = useState<Listing[]>(mockListings);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['All']);

  const filters = ['All', 'Apartment', 'House', 'Hostel', 'Room'];

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.location.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilters.includes('All') ||
                         selectedFilters.includes(listing.propertyType.charAt(0).toUpperCase() + listing.propertyType.slice(1));
    
    return matchesSearch && matchesFilter;
  });

  const toggleFilter = (filter: string) => {
    if (filter === 'All') {
      setSelectedFilters(['All']);
    } else {
      const newFilters = selectedFilters.includes(filter)
        ? selectedFilters.filter(f => f !== filter && f !== 'All')
        : [...selectedFilters.filter(f => f !== 'All'), filter];
      
      setSelectedFilters(newFilters.length === 0 ? ['All'] : newFilters);
    }
  };

  const renderListingCard = (listing: Listing) => (
    <Card key={listing.id} style={styles.listingCard} mode="elevated">
      <Pressable onPress={() => router.push(`/listing/${listing.id}` as any)}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: listing.images[0] }}
            style={styles.listingImage}
            contentFit="cover"
          />
          <IconButton
            icon={isFavorite(listing.id) ? 'heart' : 'heart-outline'}
            iconColor={isFavorite(listing.id) ? '#FF5A5F' : '#FFFFFF'}
            containerColor="rgba(0,0,0,0.3)"
            size={24}
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              toggleFavorite(listing.id);
            }}
          />
        </View>

        <Card.Content style={styles.cardContent}>
          <View style={styles.listingHeader}>
            <Text variant="titleMedium" style={styles.listingTitle} numberOfLines={1}>
              {listing.title}
              <Button onPress={ () => { Sentry.captureException(new Error('First error')) }}>
                Try!
              </Button>
            </Text>
            <View style={styles.ratingContainer}>
              <Text variant="bodySmall">★ {listing.rating}</Text>
            </View>
          </View>
          
          <Text variant="bodyMedium" style={styles.location} numberOfLines={1}>
            {listing.location.city}, {listing.location.state}
          </Text>
          
          <Text variant="bodySmall" style={styles.description} numberOfLines={2}>
            {listing.description}
          </Text>
          
          <View style={styles.amenitiesContainer}>
            {listing.amenities.slice(0, 3).map((amenity, index) => (
              <Chip key={index} compact style={styles.amenityChip}>
                {amenity}
              </Chip>
            ))}
            {listing.amenities.length > 3 && (
              <Text variant="bodySmall" style={styles.moreAmenities}>
                +{listing.amenities.length - 3} more
              </Text>
            )}
          </View>
          
          <View style={styles.priceContainer}>
            <Text variant="titleLarge" style={styles.price}>
              ${listing.price}
            </Text>
            <Text variant="bodySmall" style={styles.priceUnit}> / night</Text>
          </View>
        </Card.Content>
      </Pressable>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={1}>
        <View style={styles.headerContent}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Where to?
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Find your perfect stay
          </Text>
        </View>
      </Surface>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search destinations"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor="#666"
        />
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
        style={styles.filtersScrollView}
      >
        {filters.map((filter) => (
          <Chip
            key={filter}
            selected={selectedFilters.includes(filter)}
            onPress={() => toggleFilter(filter)}
            style={[
              styles.filterChip,
              selectedFilters.includes(filter) && styles.selectedFilterChip
            ]}
            textStyle={[
              styles.filterChipText,
              selectedFilters.includes(filter) && styles.selectedFilterChipText
            ]}
          >
            {filter}
          </Chip>
        ))}
      </ScrollView>

      {/* Listings */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.listingsContainer}>
          {filteredListings.length > 0 ? (
            filteredListings.map(renderListingCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No places found
              </Text>
              <Text variant="bodyMedium" style={styles.emptyDescription}>
                Try adjusting your search or filters
              </Text>
            </View>
          )}
        </View>
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
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  headerContent: {
    paddingTop: 8,
  },
  headerTitle: {
    fontWeight: '600',
    color: '#222222',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#717171',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    color: '#222222',
  },
  filtersScrollView: {
    marginBottom: 16,
    maxHeight: 50,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDDDDD',
    borderWidth: 1,
    marginRight: 12,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedFilterChip: {
    backgroundColor: '#222222',
    borderColor: '#222222',
  },
  filterChipText: {
    color: '#717171',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    includeFontPadding: false,
  },
  selectedFilterChipText: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  listingsContainer: {
    padding: 20,
  },
  listingCard: {
    marginBottom: 24,
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  listingImage: {
    width: '100%',
    height: 200,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  cardContent: {
    padding: 16,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  listingTitle: {
    flex: 1,
    fontWeight: '600',
    marginRight: 8,
    color: '#222222',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    color: '#717171',
    marginBottom: 8,
    fontWeight: '400',
  },
  description: {
    marginBottom: 12,
    lineHeight: 20,
    color: '#717171',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
  },
  amenityChip: {
    marginRight: 6,
    marginBottom: 4,
    backgroundColor: '#F7F7F7',
  },
  moreAmenities: {
    color: '#717171',
    fontStyle: 'italic',
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
    paddingVertical: 40,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
    color: '#222222',
  },
  emptyDescription: {
    textAlign: 'center',
    color: '#717171',
  },
});