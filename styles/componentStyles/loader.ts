import { StyleSheet } from "react-native";

export const loaderStyles = StyleSheet.create({
    loaderV: {
        width: 120,
        height: 120,
        backgroundColor: "#f5f5f5",
        borderRadius: 150
    },

    main: {
        width: "100%",
        height: "100%",
        backgroundColor: "#f0f0f0",
        position: "absolute",
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.5
    },

    loader: {
        width: "100%",
        height: "100%"
    }
})
