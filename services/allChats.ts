import axios from "axios"
import { getAccessToken } from "./apiConstants"
import { api } from "./apiClient"

const allChats = async () => {
    return await api.get(
        "/chat/rooms/with-last-message"
    )
}

export const getAllChats = async () => {

    const result: Array<any> = []

    try {
        const res = await allChats()

        result[0] = "200"
        result[1] = res.data

    } catch (err: unknown) {

        if (axios.isAxiosError(err)) {
            result[0] = err.response?.status?.toString()
            result[1] = err.response?.data["error"]

            if (result[1] == undefined) result[1] = ("Server Down. Try Again Later.")

        }

    }

    return result
}
