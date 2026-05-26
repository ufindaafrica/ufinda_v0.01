import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

/** Secure storage on native; AsyncStorage on web (expo-secure-store is not supported on web). */
export async function getItemAsync(key: string): Promise<string | null> {
    if (isWeb) {
        return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
}

export async function setItemAsync(key: string, value: string): Promise<void> {
    if (isWeb) {
        await AsyncStorage.setItem(key, value);
        return;
    }
    await SecureStore.setItemAsync(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
    if (isWeb) {
        await AsyncStorage.removeItem(key);
        return;
    }
    await SecureStore.deleteItemAsync(key);
}
