package chat
import (
	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api"
	"net/url"
	"fmt"
	"time"
	"strconv"
)

const DefaultPageSize = 20
const MsgServerError = "An unexpected error occurred. Please try again."

func GetCloudinarySignature(cld *cloudinary.Cloudinary) (map[string]interface{}, error) {
    timestamp := time.Now().Unix()

    // 1. Setup parameters to sign
    params := url.Values{}
    params.Add("timestamp", strconv.FormatInt(timestamp, 10))
    params.Add("folder", "chat")
    params.Add("resource_type", "auto")

    // 2. Generate the signature using the Cloudinary API Secret
    signature, err := api.SignParameters(params, cld.Config.Cloud.APISecret)
    if err != nil {
        return nil, fmt.Errorf("failed to get signature: %w", err)
    }

    response := map[string]interface{}{
        "signature":  signature,
        "timestamp":  timestamp,
        "api_key":    cld.Config.Cloud.APIKey,
        "cloud_name": cld.Config.Cloud.CloudName,
        "folder":     "chat",
        "resource_type": "auto",
    }

    return response, nil
}