import axios from "axios"
import { BASE_URL, getAccessToken, timeout } from "./apiConstants"
import { api } from "./apiClient"

export const createNewChat = async (data : any) => {

    const result: Array<any> = []

    try {
        const res = await api.post(
            "/chat/rooms",
            data,
            {
                headers: {
                    "Content-Type": "application/json",
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

    console.log(result)

    return result
}
