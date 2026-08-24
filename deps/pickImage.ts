import * as ImagePicker from "expo-image-picker"
import { toast } from "./toast"
// import { Image as ImageCompressor, Video as VideoCompressor } from "react-native-compressor"
// import * as FileSystem from "expo-file-system/legacy"

// async function compressMedia(uri: string, depth = 0, type: "image" | "video") {

//     const maxSize = (type === "image") ? 3 * 1024 * 1024 : 15 * 1024 * 1024

//     if (depth > 5) {
//         return uri;
//     }

//     const file = await FileSystem.getInfoAsync(uri)
//     const uriSize = (file.exists && file.size) ? file.size : 0

//     if (uriSize <= maxSize) {
//         return uri
//     }

//     else {
//         const compressedUri = type === "image" ? await ImageCompressor.compress(uri, {
//             compressionMethod: "manual",
//             maxWidth: 1024,
//             quality: 0.4
//         }) : await VideoCompressor.compress(uri, {
//             compressionMethod: "manual",
//             maxSize: 50 * 1024 * 1024
//         })

//         return compressMedia(compressedUri, depth + 1, type)
//     }

// }

export const pickMedia = async (type: "image" | "video", uploadMethod: "camera" | "gallery") => {
    let error = ""

    const selectedImage = uploadMethod === "camera" ? await ImagePicker.launchCameraAsync({
        mediaTypes: [`${type}s`],
        allowsEditing: false,
        quality: 0.4,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.VGA640x480
    }) : await ImagePicker.launchImageLibraryAsync({
        mediaTypes: [`${type}s`],
        allowsEditing: false,
        quality: 0.4,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.VGA640x480
    })

    if (!selectedImage.canceled) {

        const MAX_IMG = 900 * 1024 * 1024
        const MAX_VID = 10000 * 1024 * 1024

        if (type == "image" && (selectedImage.assets[0].fileSize ?? 0) >= MAX_IMG) {
            error = "error: image is more than 900MB"
            return {
                "error": error
            }
        }

        if (type == "video" && (selectedImage.assets[0].fileSize ?? 0) >= MAX_VID) {
            error = "error: video is more than 10GB"
            return {
                "error": error
            }
        }

        return {
            "uri": selectedImage.assets[0].uri,
            "name": selectedImage.assets[0].fileName,
            "type": `${type}/` + selectedImage.assets[0].fileName?.split(".").pop()?.toLowerCase()
        }

    } else {
        error = "cancelled"

        return {
            "error": error
        }
    }
}


export const pickChatMedia = async () => {

    const selectedImage = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsMultipleSelection: false,
        allowsEditing: false
    })

    if (!selectedImage.canceled) {

        if ((selectedImage.assets[0].fileSize ?? 0) >= 500 * 1024 * 1024) {
            toast("file size is too big")
            return null
        }

        return {
            "uri": selectedImage.assets[0].uri,
            "name": selectedImage.assets[0].fileName ?? "",
            "type": `${selectedImage.assets[0].type}/` + (selectedImage.assets[0].fileName?.split(".").pop()?.toLowerCase() ?? "")
        }

    } else {
        return null
    }
}

