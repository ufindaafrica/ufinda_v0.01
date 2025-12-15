import axios from "axios"
import { BASE_URL, getAccessToken, timeout } from "./apiConstants"

export const getChatMessages = async (data : any) => {

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
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }
        )

        result[0] = "200"
        result[1] = res.data
        console.log("res.data =>", res.data)

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
