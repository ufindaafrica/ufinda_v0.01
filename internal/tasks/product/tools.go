package producttasks
import (
	"github.com/oladev/ufinda_v0.01/internal/tasks"
)

const (
    TypeProductMediaUpload = "product:media:upload"
)

// defines the data for the background media upload task
type ProductMediaUploadPayload struct {
	ProductID string
	VendorID string
	ImageFilesData []tasks.FileData
	VideoFilesData []tasks.FileData
}