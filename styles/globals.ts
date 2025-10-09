import { StyleSheet } from "react-native";

export const fonts = {
    regular: "Roboto_400Regular",
    bold: "Roboto_700Bold",
    light: "Roboto_300Light"
}

export const globals = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "green"
    },
    text: {
        fontFamily: "System",
        fontSize: 30
    }
});
