import axios from "axios"
import { BASE_URL, getAccessToken, timeout } from "./apiConstants"

export const getAllChats = async () => {

    const token = await getAccessToken()
    const result: Array<any> = []

    try {
        const res = await axios.get(
            "/chat/rooms/with-last-message",
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
        console.log("res.data ==> ", res.data)

    } catch (err: unknown) {

        if (axios.isAxiosError(err)) {

            result[0] = err.status?.toString()
            result[1] = err.response?.data["error"]

            if (result[1] == undefined) result[1] = ("Server Down. Try Again Later.")
        }

    }

    return result
}
