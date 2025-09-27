# Ufinda - Airbnb-style Rental App

A beautiful, demo-ready MVP mobile app built with React Native and Go, featuring an Airbnb-inspired UI/UX for rental property bookings.

## � Features

### 👥 User Features

- **Authentication**: Sign up/login for both guests and hosts
- **Browse Listings**: Beautiful card-based listing display with search and filters
- **Detailed Views**: Rich listing details with image carousels and reviews
- **Booking System**: Complete booking flow with date selection and payment simulation
- **Favorites**: Bookmark and save favorite listings
- **User Profile**: Manage personal information and booking history

### 🏠 Host Features  

- **Host Dashboard**: Manage property listings
- **Add Listings**: Create new property listings with images and details
- **Booking Management**: View and manage incoming booking requests
- **Analytics**: Track booking performance (planned feature)

### 🔧 Technical Features

- **Modern UI**: Clean, Airbnb-inspired design with React Native Paper
- **REST API**: Full-featured Go backend
- **Database**: SQLite with comprehensive data models
- **Authentication**: JWT-based secure authentication
- **Image Handling**: Support for multiple property images
- **Search & Filters**: Advanced property search capabilities
- **Real-time**: Ready for real-time features (WebSocket support planned)

## 📱 Screenshots

The app features a modern, clean design with:

- Large, beautiful listing images
- Intuitive navigation
- Professional typography
- Subtle shadows and rounded corners
- Consistent color scheme

## 🛠️ Tech Stack

### Frontend (React Native)

- **React Native** with Expo
- **React Navigation** for routing
- **React Native Paper** for UI components
- **AsyncStorage** for local data
- **Expo Image** for optimized images
- **TypeScript** for type safety


## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (install with `npm install -g @expo/cli`)
- iOS Simulator or Android Emulator (optional)
- Expo Go app on mobile device (optional)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone 
cd ufinda
```

### 3. Frontend Setup

```bash
# Navigate back to root directory
cd ..

# Install dependencies
npm install

# Start Expo development server
npm start
```

### 4. Running on Device/Emulator

- **Mobile Device**: Install Expo Go app and scan the QR code
- **iOS Simulator**: Press `i` in the Expo terminal
- **Android Emulator**: Press `a` in the Expo terminal  
- **Web Browser**: Press `w` in the Expo terminal

## 🔑 Demo Credentials

### Guest Account

- **Email**: <demo@user.com>
- **Password**: password

### Host Account  

- **Email**: <demo@host.com>
- **Password**: password

## 📁 Project Structure

```
rentiz/
├── app/                          # React Native app screens
│   ├── _layout.tsx              # Main app layout
│   ├── index.tsx                # Landing/redirect screen
│   ├── auth.tsx                 # Authentication screen
│   ├── home.tsx                 # Main listing browse screen
│   ├── listing/[id].tsx         # Listing detail screen
│   └── booking/[id].tsx         # Booking confirmation screen
├── contexts/                     # React contexts
│   └── AuthContext.tsx          # Authentication context
├── types/                        # TypeScript type definitions
│   └── index.ts                 # App-wide interfaces
└── README.md                    # This file
```

## 🔗 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Listings

- `GET /api/listings` - Get all listings (with filters)
- `GET /api/listings/:id` - Get listing by ID
- `POST /api/listings` - Create new listing (hosts only)

### Bookings

- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id/status` - Update booking status (hosts)

### Favorites

- `GET /api/favorites` - Get user favorites
- `POST /api/favorites` - Add to favorites
- `DELETE /api/favorites/:listingId` - Remove from favorites
- `GET /api/favorites/check/:listingId` - Check if favorited

### Users

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

## 🎨 Design System

The app follows Airbnb's design principles:

### Colors

- **Primary**: #FF5A5F (Airbnb Red)
- **Secondary**: #00A699 (Airbnb Teal)  
- **Background**: #FAFAFA
- **Surface**: #FFFFFF
- **Text**: #333333, #666666

### Typography

- Clean, readable fonts
- Consistent sizing hierarchy
- Proper contrast ratios

### Components

- Rounded corners (12px radius)
- Subtle shadows for depth
- Consistent spacing (8px grid)
- Large, prominent images
- Intuitive iconography

## 🧪 Testing

### API Testing

```bash
# Health check
curl http://localhost:3000/api/health

# Get listings
curl http://localhost:3000/api/listings

# Login test
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@user.com","password":"password"}'
```

## 📦 Available Scripts

### Frontend

- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser


## 🚧 Planned Features

- **Real-time notifications** for booking updates
- **Image uploads** for user avatars and listings
- **Map integration** for location visualization  
- **Advanced search filters** (price range, amenities)
- **Review system** for completed bookings
- **Payment integration** (Stripe/PayPal)
- **Push notifications** via Expo
- **Offline support** with data caching
- **Admin dashboard** for platform management


## 🤝 Contributing

This is a demo project, but contributions are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable  
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Airbnb** for design inspiration
- **React Native Paper** for beautiful UI components
- **Unsplash** for placeholder images
- **Expo** for excellent development tools

## 📞 Support

For questions or issues:

- Create an issue in this repository
- Check the troubleshooting section above
- Review the API documentation

---

**Built with ❤️ using React Native and Go**
