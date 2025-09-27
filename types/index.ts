export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  images: string[];
  amenities: string[];
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  propertyType: 'apartment' | 'house' | 'hostel' | 'room' | 'studio';
  landlordId: string;
  isAvailable: boolean;
  rating: number;
  reviewCount: number;
  rules: string[];
  checkInTime: string;
  checkOutTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  listingId: string;
  userId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  listing?: Listing;
}

export interface Review {
  id: string;
  listingId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export interface Favorite {
  id: string;
  userId: string;
  listingId: string;
  createdAt: string;
}