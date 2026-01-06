import axios from "axios"
import { BASE_URL, getAccessToken, timeout } from "./apiConstants"

export const getUploadSignature = async () => {

    const result: Array<any> = []
    const token = await getAccessToken()

    try {
        const res = await axios.get(
            "/hostels/signature",
            {
                baseURL: BASE_URL,
                timeout: timeout,
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
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
    const token = await getAccessToken()

    try {
        const res = await axios.get(
            "/kyc/vendor/signature",
            {
                baseURL: BASE_URL,
                timeout: timeout,
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
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
    
    console.log(result)
    return result
}

export const userUploadSignature = async () => {

    const result: Array<any> = []
    const token = await getAccessToken()

    try {
        const res = await axios.get(
            "/kyc/user/signature",
            {
                baseURL: BASE_URL,
                timeout: timeout,
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
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

    console.log(result)
    return result
}


export const chatUploadSignature = async () => {

    const result: Array<any> = []
    const token = await getAccessToken()

    try {
        const res = await axios.get(
            "/chat/signature",
            {
                baseURL: BASE_URL,
                timeout: timeout,
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
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

    console.log(result)
    return result
}
