import axios from "axios"
import { api } from "./apiClient"

const addNewHostel = async (data: any) => {
    return await api.post(
        "/hostels/create",
        data,
        {
            headers: {
                "Content-Type": "application/json",
            }
        }
    )
}

export const postHostel = async (data: any) => {

    const result: Array<any> = []

    try {
        const res = await addNewHostel(data)

        result[0] = "201"
        result[1] = res.data

    } catch (err: unknown) {

        if (axios.isAxiosError(err)) {
            result[0] = err.response?.status?.toString()
            result[1] = err.response?.data["error"]

            if (result[1] == undefined) result[1] = ("Server Down. Try Again Later.")

        }
    }

    return result
}
