import { scale, verticalScale } from "@/deps/scale";
import { StyleSheet } from "react-native";

export const loaderStyles = StyleSheet.create({
    loaderV: {
        width: scale(120),
        height: scale(120),
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
