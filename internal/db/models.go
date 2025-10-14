package db

import (
	"time"
	"github.com/google/uuid"
)

type User struct {
	ID           string    `json:"id,omitempty"`
	FirebaseID   string    `json:"firebase_id,omitempty"`
	FirstName    string    `json:"first_name" binding:"required"`
	LastName     string    `json:"last_name" binding:"required"`
	Email        string    `json:"email" binding:"required"`
	Password     string    `json:"password" binding:"required"`
	Role string `json:"role" binding:"required"`
	Phone        string    `json:"phone" binding:"required"`
	IsVerified bool `json:"is_verified"`
	AuthProvider string     `json:"auth_provider"`
	CreatedAt    time.Time `json:"created_at,omitempty"`
	UpdatedAt    time.Time `json:"updated_at,omitempty"`
}

type PendingUser struct {
	ID        uuid.UUID    `json:"id"`
	Email     string    `json:"email" binding:"required"`
	Password  string    `json:"password" binding:"required"`
	FirstName string    `json:"first_name" binding:"required"`
	LastName  string    `json:"last_name" binding:"required"`
	Role string         `json:"role" binding: required`
	Phone     string    `json:"phone" binding:"required"`
	OTP       string    `json:"otp" binding:"required"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expire_at"`
}

type UserKYC struct {
	ID        string    `json:"id,omitempty"`
	UserID    string    `json:"user_id"`
	Level     string    `json:"level,omitempty"`
	Faculty   string    `json:"faculty,omitempty"`
	Dept      string    `json:"dept,omitempty"`
	Matric    string    `json:"matric,omitempty"`
	AboutMe string `json:"about_me,omitempty"`
	ProfileImg UploadedFile `json:"profile_img,omitempty"`
	IsStudent bool 	`json:"is_student,omitempty"`
	CreatedAt time.Time `json:"created_at,omitempty"`
	UpdatedAt time.Time `json:"updated_at,omitempty"`
}

type SecurityLog struct {
	ID        uuid.UUID `json:"id"`
	UserID    string `json:"user_id"`
	Log       string `json:"log" binding:"required"`
	Level     string `json:"level" binding:"required"`
	CreatedAt string `json:"created_at,omitempty"`
	UpdatedAt time.Time `json:"updated_at"`
}

type UploadedFile struct {
	URL string `json:"url"`
	PublicID string `json:"public_id"`
}

type Hostel struct {
	ID               string    `json:"id,omitempty"`
	VendorID string `json:"vendor_id"`
	TotalPrice       int64    `json:"total_price" binding:"required"`
	Location         string    `json:"location" binding:"required"`
	RoomType         string    `json:"room_type" binding:"required"`
	RentPerYear      int64    `json:"rent_per_year" binding:"required"`
	LandlordResides  string      `json:"landlord_resides" binding:"required"`
	TotalHostelRooms int       `json:"total_hostel_rooms"`
	RoommatesAllowed string      `json:"roommates_allowed" binding:"required"`
	KitchenAccess    string    `json:"kitchen_access" binding:"required"`
	ToiletAccess     string      `json:"toilet_access" binding:"required"`
    HostelImages     []UploadedFile  `json:"hostel_images"`
    HostelVideos     []UploadedFile  `json:"hostel_videos"`
	Description      string    `json:"description"`
	CreatedAt        time.Time `json:"created_at,omitempty"`
	UpdatedAt        time.Time `json:"updated_at,omitempty"`
}

type KycLog struct {
	ID uuid.UUID `json:"id,omitempty"`
	UserID string `json:"user_id" binding:"required"`
	Reason string `json:"reason" binding:"required"`
	CreatedAt time.Time `json:"created_at,omitempty"`
	UpdatedAt time.Time `json:"updated_at,omitempty"`
}

type HostelLog struct {
	ID uuid.UUID `json:"id"`
	UserID string `json:"user_id"`
	HostelID *string `json:"hostel_id,omitempty"`
	Reason string `json:"reason"`
	CreatedAt time.Time `json:"created_at,omitempty"`
	UpdatedAt time.Time `json:"updated_at,omitempty"`
}

type AuthLog struct {
	ID uuid.UUID `json:"id"`
	UserID string `json:"user_id"`
	Reason string `json:"reason"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}