import axios from "axios"
import { api } from "./apiClient"

export const changePassword = async (oldPassword: string, newPassword: string) => {

    const result: Array<any> = []

    try {
        const res = await api.patch(
            `/auth/change-pwd`,
            {
                old_password: oldPassword,
                new_password: newPassword
            },
            {
                headers: {
                    "Content-Type": "application/json",
                }
            }
        )

        result[0] = '200',
        result[1] = res.data
    } catch (err) {
        if (axios.isAxiosError(err)) {

            result[0] = err.status?.toString()
            result[1] = err.response?.data["error"]

            if (result[1] == undefined) result[1] = ("Server Down. Try Again Later.")
            
            console.log(err.response?.data)
        }
    } finally {

        return result
    }
}

