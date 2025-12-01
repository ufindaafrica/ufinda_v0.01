import * as ImagePicker from "expo-image-picker"

export const pickMedia = async (type: "image" | "video") => {
    let error = ""

    const selectedImage = await ImagePicker.launchCameraAsync({
        mediaTypes: [`${type}s`],
        allowsEditing: false,
        quality: 0,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.Low
    })

    if (!selectedImage.canceled) {

        const MAX_IMG = 3 * 1024 * 1024
        const MAX_VID = 15 * 1024 * 1024

        console.log(selectedImage.assets[0].fileSize)

        if (type == "image" && (selectedImage.assets[0].fileSize ?? 0) >= MAX_IMG) {
            error = "error: image is more than 3MB"
            return {
                "error": error
            }
        }

        if (type == "video" && (selectedImage.assets[0].fileSize ?? 0) >= MAX_VID) {
            error = "error: video is more than 15MB"
            return {
                "error": error
            }
        }

        return {
            "media": selectedImage.assets[0].uri,
            "mediaName": selectedImage.assets[0].fileName,
            "mediaType": `${type}/` + selectedImage.assets[0].fileName?.split(".").pop()?.toLowerCase()
        }

    } else {
        error = "cancelled"

        return {
            "error": error
        }
    }
}
