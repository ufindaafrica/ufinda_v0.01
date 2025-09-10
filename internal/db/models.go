package db

import (
	"time"
	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID    `json:"id,omitempty"`
	FirebaseID   string    `json:"firebase_id,omitempty"`
	FirstName    string    `json:"first_name" binding:"required"`
	LastName     string    `json:"last_name" binding:"required"`
	Email        string    `json:"email" binding:"required"`
	Password     string    `json:"password" binding:"required"`
	Role string `json:"role" binding:"required"`
	Phone        string    `json:"phone" binding:"required"`
	AboutMe      string    `json:"about_me"`
	IsUserKycVerified bool 	`json:"is_user_kyc_verified,omitempty"`
	IsVendorKycVerified bool `json:"is_vendor_kyc_verified,omitempty"`
	ProfileImg   string      `json:"profile_img"`
	AuthProvider string     `json:"auth_provider"`
	CreatedAt    time.Time `json:"created_at,omitempty"`
	UpdatedAt    time.Time `json:"updated_at,omitempty"`
}

type PendingUser struct {
	ID        uuid.UUID    `json:"id,omitempty"`
	Email     string    `json:"email" binding:"required"`
	Password  string    `json:"password" binding:"required"`
	FirstName string    `json:"first_name" binding:"required"`
	LastName  string    `json:"last_name" binding:"required"`
	Role string         `json:"role" binding: required`
	Phone     string    `json:"phone" binding:"required"`
	OTP       string    `json:"otp" binding:"required"`
	CreatedAt time.Time `json:"created_at,omitempty"`
	ExpiresAt time.Time `json:"expire_at,omitempty"`
}

type UserKYC struct {
	ID        uuid.UUID    `json:"id,omitempty"`
	UserID    uuid.UUID    `json:"user_id" binding:"required"`
	NIN       string    `json:"nin" binding:"required"`
	Level     string    `json:"level" binding:"required"`
	Faculty   string    `json:"faculty" binding:"required"`
	Dept      string    `json:"dept" binding:"required"`
	Matric    string    `json:"matric" binding:"required"`
	Status    string    `json:"status,omitempty"`
	CreatedAt time.Time `json:"created_at,omitempty"`
	UpdatedAt time.Time `json:"updated_at,omitempty"`
}

type SecurityLog struct {
	ID        uuid.UUID `json:"id,omitempty"`
	UserID    *uuid.UUID `json:"user_id"`
	Log       string `json:"log" binding:"required"`
	Level     string `json:"level" binding:"required"`
	CreatedAt string `json:"created_at,omitempty"`
	UpdatedAt time.Time `json:"updated_at"`
}

type UploadedImage struct {
	URL string `json:"url"`
	PublicID string `json:"public_id"`
}

type UploadedVideo struct {
	URL string `json:"url"`
	PublicID string `json:"public_id"`
}

type Hostel struct {
	ID               uuid.UUID    `json:"id,omitempty"`
	VendorID uuid.UUID `json:"vendor_id"`
	TotalPrice       int64    `json:"total_price" binding:"required"`
	Location         string    `json:"location" binding:"required"`
	RoomType         string    `json:"room_type" binding:"required"`
	RentPerYear      int64    `json:"rent_per_year" binding:"required"`
	LandlordResides  string      `json:"landlord_resides" binding:"required"`
	TotalHostelRooms int       `json:"total_hostel_rooms"`
	RoommatesAllowed string      `json:"roommates_allowed" binding:"required"`
	KitchenAccess    string    `json:"kitchen_access" binding:"required"`
	ToiletAccess     string      `json:"toilet_access" binding:"required"`
    HostelImages     []UploadedImage  `json:"hostel_images"`
    HostelVideos     []UploadedVideo  `json:"hostel_videos"`
	Description      string    `json:"description"`
	CreatedAt        time.Time `json:"created_at,omitempty"`
	UpdatedAt        time.Time `json:"updated_at,omitempty"`
}

type KycFailReason struct {
	ID uuid.UUID `json:"id" binding:"required"`
	UserID string `json:"user_id" binding:"required"`
	Reason string `json:"reason" binding:"required"`
	CreatedAt time.Time `json:"created_at,omitempty"`
	UpdatedAt time.Time `json:"updated_at,omitempty"`
}

type HostelLogs struct {
	ID uuid.UUID `json:"id,omitempty"`
	UserID uuid.UUID `json:"user_id"`
	Log string `json:"log"`
	Level string `json:"level"`
	CreatedAt time.Time `json:"created_at,omitempty"`
	UpdatedAt time.Time `json:"updated_at,omitempty"`
}

