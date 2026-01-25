import axios from "axios"
import { BASE_URL, getAccessToken, timeout } from "./apiConstants"
import { api } from "./apiClient"

export const getUploadSignature = async () => {

    const result: Array<any> = []

    try {
        const res = await api.get(
            "/hostels/signature"
        )

        result[0] = "200"
        result[1] = res.data

    } catch (err: unknown) {

        if (axios.isAxiosError(err)) {

            result[0] = err.status?.toString()
            result[1] = err.response?.data["error"]

            if (result[1] == undefined) result[1] = ("Server Down. Try Again Later.")
        }

    }

    return result
}


export const vendorUploadSignature = async () => {

    const result: Array<any> = []

    try {
        const res = await api.get(
            "/kyc/vendor/signature"
        )

        result[0] = "200"
        result[1] = res.data

    } catch (err: unknown) {

        if (axios.isAxiosError(err)) {

            result[0] = err.status?.toString()
            result[1] = err.response?.data["error"]

            if (result[1] == undefined) result[1] = ("Server Down. Try Again Later.")
        }

    }

    return result
}

export const userUploadSignature = async () => {

    const result: Array<any> = []

    try {
        const res = await api.get(
            "/kyc/user/signature"
        )

        result[0] = "200"
        result[1] = res.data

    } catch (err: unknown) {

        if (axios.isAxiosError(err)) {

            result[0] = err.status?.toString()
            result[1] = err.response?.data["error"]

            if (result[1] == undefined) result[1] = ("Server Down. Try Again Later.")
        }

    }

    return result
}


export const chatUploadSignature = async () => {

    const result: Array<any> = []

    try {
        const res = await api.get(
            "/chat/signature"
        )

        result[0] = "200"
        result[1] = res.data

    } catch (err: unknown) {

        if (axios.isAxiosError(err)) {

            result[0] = err.status?.toString()
            result[1] = err.response?.data["error"]

            if (result[1] == undefined) result[1] = ("Server Down. Try Again Later.")
        }

    }

    return result
}
