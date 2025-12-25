package producttasks

const (
    TypeProductMediaUpload = "product:media:upload"
)

// defines the data for the background media upload task
type ProductMediaUploadPayload struct {
	ProductID string
	VendorID string
	ImagePaths []string
	VideoPaths []string
}