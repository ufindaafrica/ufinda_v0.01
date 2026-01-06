import { getItemAsync } from "expo-secure-store"


export const getRole = async () => {
    const mode = await getItemAsync('ROLE')
    if (mode) return mode

    return await getItemAsync('MODE') ?? ''
}

