import axios from "axios"
import { BASE_URL, getAccessToken, timeout } from "./apiConstants"


export const getAllHostels = async () => {
    const result: Array<any> = []
    const token = await getAccessToken()

    try {
        const res = await axios.get(
            '/hostels/all',
            {
                baseURL: BASE_URL,
                params: {
                    limit: 20
                },
                headers: {
                    Authorization: `Bearer ${token}`
                },
                timeout: timeout
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
    } finally {
        
        return result
    }
}

