package db

import (
	"time"
	"github.com/google/uuid"
	"encoding/json"
)

type User struct {
	ID           string    `json:"id,omitempty"`
	FirebaseID   string    `json:"firebase_id,omitempty"`
	FirstName    string    `json:"first_name" binding:"required"`
	LastName     string    `json:"last_name" binding:"required"`
	Email        string    `json:"email" binding:"required"`
	Password     string    `json:"password" binding:"required"`
	UserName 	 *string	`json:"username,omitempty"`
	Role string `json:"role" binding:"required"`
	Phone        string    `json:"phone" binding:"required"`
	IsVerified bool `json:"is_verified"`
	Rating int`json:"rating,omitempty"`
	AuthProvider string     `json:"auth_provider"`
	CreatedAt    *time.Time `json:"created_at,omitempty"`
	UpdatedAt    *time.Time `json:"updated_at,omitempty"`
}

type PendingUser struct {
	ID        *uuid.UUID    `json:"id,omitempty"`
	Email     string    `json:"email" binding:"required"`
	Password  string    `json:"password" binding:"required"`
	FirstName string    `json:"first_name" binding:"required"`
	UserName *string	`json:"username,omitempty"`
	LastName  string    `json:"last_name" binding:"required"`
	Role string         `json:"role" binding: required`
	Phone     string    `json:"phone" binding:"required"`
	OTP       string    `json:"otp" binding:"required"`
	CreatedAt *time.Time `json:"created_at,omitempty"`
	ExpiresAt time.Time `json:"expire_at"`
}

type UserKYC struct {
	ID        *uuid.UUID    `json:"id,omitempty"`
	UserID    string    `json:"user_id"`
	Level     string    `json:"level,omitempty"`
	Faculty   string    `json:"faculty,omitempty"`
	Dept      string    `json:"dept,omitempty"`
	Address string `json:"address,omitempty"`
	Matric    string    `json:"matric,omitempty"`
	AboutMe string `json:"about_me,omitempty"`
	ProfileImg *UploadedFile `json:"profile_img,omitempty"`
	IsStudent bool 	`json:"is_student,omitempty"`
	CreatedAt *time.Time `json:"created_at,omitempty"`
	UpdatedAt *time.Time `json:"updated_at,omitempty"`
}

type SecurityLog struct {
	ID        *uuid.UUID `json:"id,omitempty"`
	UserID    *string `json:"user_id"`
	Log       string `json:"log" binding:"required"`
	Level     string `json:"level" binding:"required"`
	CreatedAt *time.Time `json:"created_at,omitempty"`
	UpdatedAt *time.Time `json:"updated_at,omitempty"`
}

type UploadedFile struct {
	URL string `json:"url"`
	PublicID string `json:"public_id"`
}

type Hostel struct {
	ID               string    `json:"id,omitempty"`
	VendorID string `json:"vendor_id"`
	Title string `json:"title"`
	TotalPrice       int64    `json:"total_price" binding:"required"`
	Location         string    `json:"location" binding:"required"`
	RoomType         string    `json:"room_type" binding:"required"`
	RentPerYear      int64    `json:"rent_per_year" binding:"required"`
	LandlordResides  string      `json:"landlord_resides" binding:"required"`
	TotalHostelRooms int       `json:"total_hostel_rooms"`
	PowerSupply string `json:"power_supply"`
	AvailableRooms *int `json:"available_rooms" binding:"required,gt=1"`
	RoommatesAllowed string      `json:"roommates_allowed" binding:"required"`
	KitchenAccess    string    `json:"kitchen_access" binding:"required"`
	ToiletAccess     string      `json:"toilet_access" binding:"required"`
    HostelImages     []UploadedFile  `json:"hostel_images"`
    HostelVideos     []UploadedFile  `json:"hostel_videos"`
	Description      string    `json:"description"`
	GeoLocation *GeoLocationField `json:"geolocation,omitempty"`
	CreatedAt        *time.Time `json:"created_at,omitempty"`
	UpdatedAt        *time.Time `json:"updated_at,omitempty"`
}



type KycLog struct {
	ID *uuid.UUID `json:"id,omitempty"`
	UserID string `json:"user_id" binding:"required"`
	Reason string `json:"reason" binding:"required"`
	CreatedAt *time.Time `json:"created_at,omitempty"`
	UpdatedAt *time.Time `json:"updated_at,omitempty"`
}

type HostelLog struct {
	ID *uuid.UUID `json:"id,omitempty"`
	VendorID string `json:"vendor_id"`
	Reason string `json:"reason"`
	CreatedAt *time.Time `json:"created_at,omitempty"`
	UpdatedAt *time.Time `json:"updated_at,omitempty"`
}

type ProductLog struct {
	ID *uuid.UUID `json:"id,omitempty"`
	VendorID string `json:"vendor_id"`
	ProductID *string `json:"product_id,omitempty"`
	Reason string `json:"reason"`
	CreatedAt *time.Time `json:"created_at,omitempty"`
	UpdatedAt *time.Time `json:"updated_at,omitempty"`
}

type AuthLog struct {
	ID *uuid.UUID `json:"id,omitempty"`
	UserID string `json:"user_id"`
	Reason string `json:"reason"`
	CreatedAt *time.Time `json:"created_at,omitempty"`
	UpdatedAt *time.Time `json:"updated_at,omitempty"`
}

type ChatLog struct {
	ID *uuid.UUID `json:"id,omitempty"`
	UserID string `json:"user_id"`
	Reason string `json:"reason"`
	CreatedAt *time.Time `json:"created_at,omitempty"`
	UpdatedAt *time.Time `json:"updated_at,omitempty"`
}

type ResetPwdData struct {
	ID *uuid.UUID `json:"id,omitempty"`
	Token string `json:"token"`
	UserID string `json:"user_id"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt *time.Time `json:"created_at,omitempty"`
}

type DojahWebhookPayload struct {
	ReferenceID        string          `json:"reference_id"` // This is your User ID
	VerificationStatus string          `json:"verification_status"`
	VerificationURL    string          `json:"verification_url"`
	
	NINValueSubmitted  string          `json:"value"` 
	VerificationMode   string          `json:"verification_mode"` // e.g., "OTP" or "LIVENESS"
	Status             bool            `json:"status"` // Overall success status of the transaction
	Metadata           WebhookMetadata `json:"metadata"`
	Data               WebhookData     `json:"data"`
}

type GovernmentData struct {
	Data struct {
		NIN NINData `json:"nin"`
	} `json:"data"`
}

type WebhookData struct {
	GovernmentData GovernmentData `json:"government_data"`
}

type NINEntity struct {
	FirstName       string `json:"first_name"`
	LastName        string `json:"last_name"`
	DateOfBirth     string `json:"date_of_birth"` 
	NIN             string `json:"nin"`          
	BirthState      string `json:"birth_state"`
	BirthCountry    string `json:"birth_country"`
	ResidenceState  string `json:"residence_state"`
	ResidenceAddress string `json:"residence_AddressLine1"`
	ResidenceLGA 	string `json:"residence_lga"`
	Gender          string `json:"gender"`
}

type NINData struct {
	Entity NINEntity `json:"entity"`
}

type WebhookMetadata struct {
	IpInfo IpInfo `json:"ipinfo"`
	UserID string `json:"user_id"`
}

type IpInfo struct {
	StateOfCall string `json:"region_name"`
	CountryOfCall string `json:"country"`
}

type VendorKYC struct {
	ID *uuid.UUID `json:"id,omitempty"`
	UserID string `json:"user_id"`
	NIN string `json:"nin"`
	IsVerified bool `json:"is_verified"`
	AboutMe string `json:"about_me"`
	ProfileImg *UploadedFile `json:"profile_img"`
	Status string `json:"status"`
	VerificationMode string `json:"verification_mode"`
	VerificationLink string `json:"verification_link"`
	Gender string `json:"gender"`
	DOB string `json:"dob"`
	StateOfOrigin string `json:"state_of_origin"`
	Nationality string `json:"nationality"`
	ResidenceLGA string `json:"residence_lga"`
	ResidenceAddress1 string `json:"residence_address1"`
	ResidenceAddress2 string `json:"residence_address2"`
	StateOfResidence string `json:"state_of_residence"`
}

type Favorites struct {
	ID *uuid.UUID `json:"id,omitempty"`
	UserID string `json:"user_id"`
	HostelID string `json:"hostel_id" binding:"required"`
}

type Product struct {
    ID            string          `json:"id"`
    VendorID      string          `json:"vendor_id"`
    Title         string          `json:"title"`
    Price         int64           `json:"price"`
    Description   string          `json:"description"`
    Attributes    json.RawMessage `json:"attributes"`
    ProductImages []UploadedFile  `json:"product_images"`
    ProductVideo  *UploadedFile   `json:"product_video"`
    IsAvailable   bool            `json:"is_available"`
    CreatedAt     *time.Time      `json:"created_at"`
    UpdatedAt     *time.Time      `json:"updated_at"`
    CategoryID    *uuid.UUID         `json:"category_id"` // Matches your DB column
}

type Rating struct {
	ID *uuid.UUID `json:"id,omitempty"`
	VendorID string `json:"vendor_id"`
	ReviewerID string `json:"reviewer_id"`
	Score int `json:"score"`
	CreatedAt *time.Time `json:"created_at,omitempty"`
	Review string `json:"review"`
}

// VendorMetrics matches the data retrieved from the 'vendor_metrics' table
type VendorMetrics struct {
    CurrentRating float64 `json:"current_rating"`
    TotalRatings  int     `json:"total_ratings"` // Included for completeness, even if not extracted
}

// VendorKycInfo matches the data retrieved from the 'vendor_kyc' table
type VendorKycInfo struct {
    ProfileImg UploadedFile `json:"profile_img"` 
}

// UserAgentInfo is the main structure for the agent's data joined through 'users'
type UserAgentInfo struct {
	UserName string 	`json:"username"`
    Phone        string          `json:"phone"`
    VendorMetrics *VendorMetrics `json:"vendor_metrics"`
    
    VendorKyc     *VendorKycInfo `json:"vendor_kyc"`
}

// db/models.go (or similar)

type EnrichedHostel struct {
    Hostel 
    Users *UserAgentInfo `json:"vendor_info"`
}


type ProductItem struct {
	ID string `json:"id"`
	CategoryID uuid.UUID `json:"category_id"`
	Title string `json:"title"`
	Price int64 `json:"price"`
	Description string `json:"description"`
	Attributes map[string]interface{} `json:"attributes"`
	Images []UploadedFile `json:"product_images"`
	Video *UploadedFile `json:"product_video"`
	CreatedAt *time.Time `json:"created_at,omitempty"`
	UpdatedAt *time.Time `json:"updated_at,omitempty"`
}

type UserProfileInfo struct {
	FirstName string `json:"first_name"`
	LastName string `json:"last_name"`
	Email string `json:"email"`
	Phone string `json:"phone"`
	KYC *UserKYC `json:"kyc_data"`
}

type VendorProfileInfo struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
	KYC *VendorKYCExtra `json:"kyc_data"`
}

type VendorKYCExtra struct {
	ProfileImg *UploadedFile `json:"profile_img"`
	AboutMe    string        `json:"about_me"`

	Address1 *string `json:"-"`
	Address2 *string `json:"-"`

	ResidenceAddress string `json:"residence_address"`
}

func (k *VendorKYCExtra) UnmarshalJSON(data []byte) error {
    // 1. Define a shadow struct that HAS the tags Supabase uses
    type Shadow struct {
        ProfileImg *UploadedFile `json:"profile_img"`
        AboutMe    string        `json:"about_me"`
        Addr1      *string       `json:"residence_address1"` // Explicitly map DB name
        Addr2      *string       `json:"residence_address2"` // Explicitly map DB name
    }

    var s Shadow
    if err := json.Unmarshal(data, &s); err != nil {
        return err
    }

    // 2. Transfer values to your real struct
    k.ProfileImg = s.ProfileImg
    k.AboutMe = s.AboutMe
    k.Address1 = s.Addr1
    k.Address2 = s.Addr2

    // 3. The Logic: Pick the best address
    if s.Addr1 != nil && *s.Addr1 != "" {
        k.ResidenceAddress = *s.Addr1
    } else if s.Addr2 != nil && *s.Addr2 != "" {
        k.ResidenceAddress = *s.Addr2
    } else {
        k.ResidenceAddress = "" // Fallback if both are nil/empty
    }

    return nil
}

type GeoLocationField struct {
	Latitude float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type PushNotificationToken struct {
	ID *uuid.UUID `json:"id,omitempty"`
	UserID string `json:"user_id"`
	DeviceToken string `json:"device_token"`
	DeviceOS string `json:"device_os"`
	CreatedAt *time.Time `json:"created_at"`
}

type ProfileView struct {
	ID *uuid.UUID `json:"id,omitempty"`
	UserID string `json:"user_id"`
	VendorID string `json:"vendor_id"`
	CreatedAt *time.Time `json:"created_at,omitempty"`
}

type MetricLog struct {
	ID *uuid.UUID `json:"id,omitempty"`
	UserID string `json:"user_id"`
	Reason string `json:"reason"`
	CreatedAt *time.Time `json:"created_at,omitempty"`
	UpdatedAt *time.Time `json:"updated_at,omitempty"`
}

