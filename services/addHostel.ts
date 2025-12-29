import axios from "axios"
import { BASE_URL, getAccessToken, timeout } from "./apiConstants"

export const postHostel = async (data : any) => {

    const result: Array<any> = []
    const token = await getAccessToken()

    try {
        const res = await axios.post(
            "/hostels/create",
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

        result[0] = "201"
        result[1] = res.data

        console.log("success result => ", result)

    } catch (err: unknown) {

        if (axios.isAxiosError(err)) {

            result[0] = err.status?.toString()
            result[1] = err.response?.data["error"]
        }

        console.log(result)

    }

    return result
}
