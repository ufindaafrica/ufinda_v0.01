import axios from "axios"
import { BASE_URL, getAccessToken, timeout } from "./apiConstants"
import { api } from "./apiClient"


export const saveHostel = async (id: string) => {
    const result: Array<any> = []

    try {
        const res = await api.post(
            `/hostels/fav/${id}`,
            {}
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
        console.log(result)
        return result
    }
}

export const removeSavedHostel = async (id: string) => {
    const result: Array<any> = []

    try {
        const res = await api.delete(
            `/hostels/fav/${id}`
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
        console.log(result)
        return result
    }
}

export const allSavedHostels = async () => {
    const result: Array<any> = []

    try {
        const res = await api.get(
            `/hostels/fav`
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
