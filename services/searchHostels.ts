import axios from "axios"
import { BASE_URL, getAccessToken, timeout } from "./apiConstants"


export type searchParams = {
    q?: string,
    price_min?: string,
    price_max?: string,
    type?: string,
    limit?: string,
    page?: string
}

export const searchHostels = async (data: searchParams) => {
    const result: Array<any> = []
    const token = await getAccessToken()

    try {
        const res = await axios.get(
            `/hostels/search`,
            {
                baseURL: BASE_URL,
                timeout: timeout,
                params: {
                    q: data.q,
                    price_min: data.price_min,
                    price_max: data.price_max,
                    type: data.type,
                },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        )

        result[0] = "200"
        result[1] = res.data

    } catch (err) {
        if (axios.isAxiosError(err)) {

            result[0] = err.status?.toString()
            result[1] = err.response?.data["error"]

            if (result[1] == undefined) result[1] = ("Server Down. Try Again Later.")
        }
    } finally {
        return result
    }
}
