import { StyleSheet } from "react-native";
import { fonts, roboto } from "./globals";

export const otpStyles = StyleSheet.create({
    main: {
        marginTop: 32
    },

    img: {
        alignSelf: "center",
        height: 194,
        width: 194
    },

    pText: {
        width: 259
    },

    otpV: {
        flexDirection: "row",
        alignSelf: "center",
        justifyContent: "space-between",
        width: "100%"
    },

    linkV: {
        alignSelf: "center"
    },

    otpPadding: {
        padding: 16
    },

    otpPaddingHorizontal: {
        paddingHorizontal: 16
    },

    lText: {
        color: "#008000"
    },

    otpPaddingMedium: {
        paddingTop: 16
    }
})
