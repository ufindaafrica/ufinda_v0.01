package vendorproduct
import (
	"github.com/oladev/ufinda_v0.01/internal/db"
	"encoding/json"
)

type CreateProductRequest struct {
    Title        string          `json:"title" binding:"required"`
    Description  string          `json:"description" binding:"required"`
    Category     string          `json:"category" binding:"required"`
    Price        string          `json:"price" binding:"required"` // Keep as string for comma removal
    Attributes   json.RawMessage `json:"attributes"`
    ProductImages []db.UploadedFile  `json:"product_images" binding:"required,min=1,max=3"`
    ProductVideo  *db.UploadedFile   `json:"product_video" binding:"omitempty"`
}

type updateProductRequest struct {
    Price        *string          `json:"price"`
    Description  *string          `json:"description,omitempty"`
    IsAvailable   *bool            `json:"is_available,omitempty"`
}
const MsgServerError = "An unexpected error occurred. Please try again."