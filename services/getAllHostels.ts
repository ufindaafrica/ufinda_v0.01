import axios from "axios"
import { api } from "./apiClient"

const fetchHostels = async () => {
    return await api.get(
        '/hostels/all',
        {
            params: {
                // limit: 20
            }
        }
    )
}

export const getAllHostels = async () => {
    const result: Array<any> = []

    try {

        const res = await fetchHostels()
        result[0] = "200"
        result[1] = res.data

    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            result[0] = err.response?.status?.toString()
            result[1] = err.response?.data["error"]

            if (result[1] == undefined) result[1] = ("Server Down. Try Again Later.")

        }
    } finally {
        console.log(result[1].length)
        return result
    }
}

