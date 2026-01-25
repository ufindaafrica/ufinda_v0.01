import axios from "axios"
import { BASE_URL, getAccessToken, timeout } from "./apiConstants"
import { api } from "./apiClient"


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

    try {
        const res = await api.get(
            `/hostels/search`,
            {
                params: {
                    q: data.q,
                    price_min: data.price_min,
                    price_max: data.price_max,
                    type: data.type,
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
