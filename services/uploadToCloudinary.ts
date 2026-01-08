import axios from "axios"
import { BASE_URL, getAccessToken, timeout } from "./apiConstants"
import * as FileSystem from "expo-file-system/legacy"

export type uploadFilesType = {
    files: Array<any>,
    api_key: string,
    timestamp: number,
    signature: string,
    folder: string,
    cloud_name: string,
    setUploadProgress?: (value: any) => void
}

export const uploadToCloudinary = async (data: uploadFilesType) => {

    const getfilesize = async (uri: string) => {
        const info = await FileSystem.getInfoAsync(uri)
        return info.exists && info.size ? info.size : 0
    }

    const result: Array<any> = []
    const token = await getAccessToken()

    let uploadedBytes = 0

    const validFiles = data.files.filter(f => f?.uri)
    const sizes = await Promise.all(validFiles.map(f => getfilesize(f.uri)))
    const totalBytes = sizes.reduce((sum, size) => sum + size, 0)

    const uploadFiles = async (file: any) => {
        let lastLoaded = 0
        const form = new FormData()

        form.append("file", {
            uri: file.uri,
            name: file.name ?? 'file',
            type: file.type
        } as any)
        form.append("api_key", data.api_key)
        form.append("timestamp", data.timestamp.toString())
        form.append("signature", data.signature)
        form.append("folder", data.folder)

        if (file.type?.startsWith("image")) {
            form.append("quality", "auto:good")
            form.append("fetch_format", "auto")
            form.append("width", "1280")
            form.append("height", "720")
            form.append("crop", "limit")
        }

        if (file.type?.startsWith("video")) {
            form.append("quality", "auto:eco")
            form.append("video_codec", "auto")
            form.append("width", "1280")
            form.append("height", "720")
            form.append("crop", "limit")
        }

        console.log("audio upload", form)

        const res = await axios.post(
            file.type?.startsWith("audio") ? `https://api.cloudinary.com/v1_1/${data.cloud_name}/video/upload` : `https://api.cloudinary.com/v1_1/${data.cloud_name}/auto/upload`,
            form,
            {
                baseURL: BASE_URL,
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
                onUploadProgress: (progressEvent) => {
                    uploadedBytes += progressEvent.loaded - lastLoaded
                    lastLoaded = progressEvent.loaded

                    const percentCompleted = Math.round((uploadedBytes / totalBytes) * 100)

                    data.setUploadProgress?.(percentCompleted)

                },
            }
        )

        result[0] = "200"
        result.push(res.data)
    }

    try {
        for (const file of data.files) {
            await uploadFiles(file)
        }

    } catch (err: unknown) {

        if (axios.isAxiosError(err)) {

            console.log(err.response)

            result[0] = err.status?.toString()
            result[1] = err.response?.data["error"]

            if (result[1] == undefined) result[1] = ("Server Down. Try Again Later.")
        }
    }

    return result
}
