import axios from "axios"
import { BASE_URL, getAccessToken, timeout } from "./apiConstants"

export const sendChat = async (data: any) => {

    const result: Array<any> = []
    const token = await getAccessToken()

    try {
        const res = await axios.post(
            "/chat/messages",
            data,
            {
                baseURL: BASE_URL,
                timeout: timeout,
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": 'application/json'
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