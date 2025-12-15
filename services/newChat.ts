import axios from "axios"
import { BASE_URL, getAccessToken, timeout } from "./apiConstants"

export const createNewChat = async (data : any) => {

    const result: Array<any> = []
    const token = await getAccessToken()

    try {
        const res = await axios.post(
            "/chat/rooms",
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
        result[1] = res.data["id"]

    } catch (err: unknown) {

        if (axios.isAxiosError(err)) {
            console.log(err)

            result[0] = err.status?.toString()
            result[1] = err.response?.data["error"]

            if (result[1] == undefined) result[1] = ("Server Down. Try Again Later.")
        }

    }

    return result
}
