import * as ImagePicker from "expo-image-picker"

export const pickMedia = async (type: "image" | "video") => {
    const selectedImage = await ImagePicker.launchCameraAsync({
        mediaTypes: [`${type}s`],
        allowsEditing: false,
        quality: 1,
        // allowsMultipleSelection: true,
        // selectionLimit: 5,
    })

    if (!selectedImage.canceled) {
        return {
            "media": selectedImage.assets[0].uri,
            "mediaName": selectedImage.assets[0].fileName,
            "mediaType": `${type}/` + selectedImage.assets[0].fileName?.split(".").pop()?.toLowerCase()
        }
    } else return null
}
