import AsyncStorage from "@react-native-async-storage/async-storage"
import { getUploadSignature } from "@/services/uploadSignature"
import { hostelListingUploadToCloudinary } from "@/services/hostelListingUploadToCloudinary"
import { postHostel } from "@/services/addHostel"
import { usePostJobStore } from "@/stores/postJobStore"

import * as Notifications from "expo-notifications"

const notifyJobResult = async (success: boolean, message: string) => {
    const { status } = await Notifications.getPermissionsAsync()
    if (status !== "granted") {
        const req = await Notifications.requestPermissionsAsync()
        if (req.status !== "granted") return
    }

    await Notifications.scheduleNotificationAsync({
        content: {
            title: success ? "Ad published" : "Couldn't publish ad",
            body: message,
        },
        trigger: null, // fires immediately
    })
}

const PENDING_JOB_KEY = "PENDING_HOSTEL_JOB"

export type HostelJobPayload = {
    title: string; address: string; hostelType: string
    numberOfRooms: number | null | undefined; totalRooms: number | null | undefined
    roomate: string; power: string; kitchen: string; toilet: string; landlord: string
    desc: string; yearlyrent: number | null | undefined; totalPrice: number | null | undefined
    longLat: any
    hostelImages: { uri: string; name?: string | null; type: string }[]
    hostelVideo: { uri: string; name?: string | null; type: string } | null
}

const buildAndPost = async (payload: HostelJobPayload, uploadCloudinary: any[]) => {
    const store = usePostJobStore.getState()
    store.setStatus("posting")

    const imgs: any[] = []
    const vid: any[] = []

    uploadCloudinary.forEach((item, index) => {
        if (index === 0) return
        if (item.resource_type === "image") imgs.push({ url: item.url, public_id: item.public_id })
        if (item.resource_type === "video") vid.push({ url: item.url, public_id: item.public_id })
    })

    const hostelData = {
        title: payload.title ?? "",
        total_price: payload.totalPrice ?? 0,
        total_hostel_rooms: payload.totalRooms ?? 0,
        rent_per_year: payload.yearlyrent ?? 0,
        location: payload.address ?? "",
        ...(payload.power && { power_supply: payload.power }),
        ...(payload.kitchen && { kitchen_access: payload.kitchen }),
        ...(payload.toilet && { toilet_access: payload.toilet }),
        ...(payload.landlord && { landlord_resides: payload.landlord }),
        ...(payload.hostelType && { room_type: payload.hostelType }),
        ...(payload.roomate && { roommates_allowed: payload.roomate }),
        ...(payload.desc && { description: payload.desc }),
        images: imgs,
        ...(vid.length > 0 && { videos: vid }),
        available_rooms: payload.numberOfRooms ?? 0,
        ...(payload.longLat && { geolocation: payload.longLat }),
    }

    const addNewHostel = await postHostel(hostelData)
    if (addNewHostel[0] !== "201") throw new Error(addNewHostel[1])

    await AsyncStorage.removeItem(PENDING_JOB_KEY)
    store.setStatus("success")
    notifyJobResult(true, "Your hostel ad is now live.")
}

export const runPostHostelJob = async (payload: HostelJobPayload) => {
    const store = usePostJobStore.getState()

    try {
        await AsyncStorage.setItem(PENDING_JOB_KEY, JSON.stringify({ stage: "uploading", payload }))
        store.setStatus("loading")

        const uploadSignature = await getUploadSignature()
        if (uploadSignature[0] !== "200") throw new Error(uploadSignature[1])

        store.setStatus("uploading")

        const uploadCloudinary = await hostelListingUploadToCloudinary({
            files: [...payload.hostelImages, ...(payload.hostelVideo ? [payload.hostelVideo] : [])],
            api_key: uploadSignature[1].api_key,
            timestamp: uploadSignature[1].timestamp,
            signature: uploadSignature[1].signature,
            folder: uploadSignature[1].folder,
            cloud_name: uploadSignature[1].cloud_name,
            setUploadProgress: store.setProgress,
        })

        if (uploadCloudinary[0] !== "200") throw new Error(uploadCloudinary[1])

        await AsyncStorage.setItem(PENDING_JOB_KEY, JSON.stringify({ stage: "posting", payload, uploadCloudinary }))
        await buildAndPost(payload, uploadCloudinary)

    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error"
        store.setStatus("error", message)
        notifyJobResult(false, message)

        // left in AsyncStorage on purpose — resumePendingJobIfAny can retry it next launch
    }
}

export const resumePendingJobIfAny = async () => {
    const raw = await AsyncStorage.getItem(PENDING_JOB_KEY)
    if (!raw) return

    const { stage, payload, uploadCloudinary } = JSON.parse(raw)

    if (stage === "posting" && uploadCloudinary) {
        buildAndPost(payload, uploadCloudinary).catch(err => {
            const message = err instanceof Error ? err.message : "Unexpected error"
            usePostJobStore.getState().setStatus("error", message)
            notifyJobResult(false, message)
        })
    } else {
        runPostHostelJob(payload) // uploads weren't confirmed done — redo from scratch
    }
}
