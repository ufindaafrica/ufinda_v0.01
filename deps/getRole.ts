import { getItemAsync } from "@/deps/secureStorage"


export const getRole = async () => {
    const mode = await getItemAsync('ROLE')
    if (mode) return mode

    return await getItemAsync('MODE') ?? ''
}

