import axios from "axios"
import { BASE_URL, getAccessToken, timeout } from "./apiConstants"
import { api } from "./apiClient"

export const markAsRead = async (data : any) => {

    const result: Array<any> = []

    try {
        const res = await api.post(
            "/chat/messages/mark-read",
            data,
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        )

        result[0] = "200"

    } catch (err: unknown) {

        if (axios.isAxiosError(err)) {

            result[0] = err.status?.toString()
            result[1] = err.response?.data["error"]

            if (result[1] == undefined) result[1] = ("Server Down. Try Again Later.")
        }

    }

    return result
}
