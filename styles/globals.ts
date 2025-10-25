import { StyleSheet } from "react-native";

export const fonts = {
    regular: "Inter_400Regular",
    bold: "Inter_700Bold",
    light: "Inter_300Light"
}

export const globals = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5"
    },
    text: {
        fontFamily: "System",
        fontSize: 30
    },
    authContainer: {
        padding: 24
    }
});
