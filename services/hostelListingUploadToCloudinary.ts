import * as FileSystem from "expo-file-system/legacy"
import { Image as ImageCompressor, Video as VideoCompressor } from "react-native-compressor"

export type hostelListingUploadFilesType = {
    files: Array<any>,
    api_key: string,
    timestamp: number,
    signature: string,
    folder: string,
    cloud_name: string,
    setUploadProgress?: (value: any) => void
    onCompressionStart?: () => void
    setCompressionProgress?: (value: number) => void
    onUploadStart?: () => void
}

export const hostelListingUploadToCloudinary = async (data: hostelListingUploadFilesType) => {

    const getfilesize = async (uri: string) => {
        const info = await FileSystem.getInfoAsync(uri)
        return info.exists && info.size ? info.size : 0
    }

    const compressFile = async (file: any, onProgress?: (pct: number) => void) => {
        try {
            if (file.type?.startsWith("image")) {
                const compressedUri = await ImageCompressor.compress(file.uri, {
                    compressionMethod: "auto",
                })
                onProgress?.(100)
                return { ...file, uri: compressedUri }
            }

            if (file.type?.startsWith("video")) {
                const compressedUri = await VideoCompressor.compress(
                    file.uri,
                    { compressionMethod: "auto" },
                    (progress) => onProgress?.(Math.round(progress * 100))
                )
                return { ...file, uri: compressedUri }
            }
        } catch (err) {
            console.log("compression failed, uploading original file instead", err)
        }

        onProgress?.(100)
        return file // audio, unknown type, or compression failure — upload as-is
    }

    const result: Array<any> = []

    let uploadedBytes = 0

    const validFiles = data.files.filter(f => f?.uri)

    const hasMediaToCompress = validFiles.some(f => f.type?.startsWith("image") || f.type?.startsWith("video"))
    if (hasMediaToCompress) data.onCompressionStart?.()

    const compressedFiles: any[] = []
    for (let i = 0; i < validFiles.length; i++) {
        const compressed = await compressFile(validFiles[i], (pct) => {
            const overall = Math.round(((i + pct / 100) / validFiles.length) * 100)
            data.setCompressionProgress?.(overall)
        })
        compressedFiles.push(compressed)
    }

    data.onUploadStart?.()

    const sizes = await Promise.all(compressedFiles.map(f => getfilesize(f.uri)))
    const totalBytes = sizes.reduce((sum, size) => sum + size, 0)

    const uploadFiles = async (file: any) => {
        let lastSent = 0

        const parameters: Record<string, string> = {
            api_key: data.api_key,
            timestamp: data.timestamp.toString(),
            signature: data.signature,
            folder: data.folder,
        }

        if (file.type?.startsWith("image")) {
            parameters.quality = "auto:good"
            parameters.fetch_format = "auto"
            parameters.width = "1280"
            parameters.height = "720"
            parameters.crop = "limit"
        }

        if (file.type?.startsWith("video")) {
            parameters.quality = "auto:eco"
            parameters.video_codec = "auto"
            parameters.width = "1280"
            parameters.height = "720"
            parameters.crop = "limit"
        }

        const task = FileSystem.createUploadTask(
            file.type?.startsWith("audio") ? `https://api.cloudinary.com/v1_1/${data.cloud_name}/video/upload` : `https://api.cloudinary.com/v1_1/${data.cloud_name}/auto/upload`,
            file.uri,
            {
                httpMethod: "POST",
                uploadType: FileSystem.FileSystemUploadType.MULTIPART,
                fieldName: "file",
                mimeType: file.type,
                sessionType: FileSystem.FileSystemSessionType.BACKGROUND, // <- survives backgrounding/lock
                parameters,
            },
            (progress) => {
                uploadedBytes += progress.totalBytesSent - lastSent
                lastSent = progress.totalBytesSent

                const percentCompleted = Math.round((uploadedBytes / totalBytes) * 100)
                data.setUploadProgress?.(percentCompleted)
            }
        )

        const res = await task.uploadAsync()

        if (!res || res.status < 200 || res.status >= 300) {
            throw new Error(res?.body ?? "Upload failed")
        }

        result[0] = "200"
        result.push(JSON.parse(res.body))
    }

    try {
        for (const file of compressedFiles) {
            await uploadFiles(file)
        }

    } catch (err: unknown) {
        console.log(err)
        result[0] = "0"
        result[1] = err instanceof Error ? err.message : "Server Down. Try Again Later."
    }

    return result
}
