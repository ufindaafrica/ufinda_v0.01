import axios from "axios"
import { api } from "./apiClient"

const updateHostel = async (data: any, id: string) => {
    return await api.patch(
        `/hostels/${id}`,
        data,
        {
            headers: {
                "Content-Type": "application/json",
            }
        }
    )
}

export const patchHostel = async (data: any, id: string) => {

    const result: Array<any> = []

    try {
        const res = await updateHostel(data, id)

        result[0] = "200"
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
