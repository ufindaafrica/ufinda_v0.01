import axios from "axios"
import { BASE_URL, getAccessToken, timeout } from "./apiConstants"

export const getChatMessages = async (data : any) => {

    const result: Array<any> = []
    const token = await getAccessToken()

    try {
        const res = await axios.get(
            "/chat/messages",
            {
                baseURL: BASE_URL,
                timeout: timeout,
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                params: data
            }
        )

        result[0] = "200"
        result[1] = res.data

    } catch (err: unknown) {

        if (axios.isAxiosError(err)) {

            result[0] = err.status?.toString()
            result[1] = err.response?.data["error"]

            console.log("error =>", err.status?.toString())

            if (result[1] == undefined) result[1] = ("Server Down. Try Again Later.")
        }

    }

    return result
}
