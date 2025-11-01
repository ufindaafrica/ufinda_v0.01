import { StyleSheet } from "react-native";
import { fonts } from "./globals";

export const otpStyles = StyleSheet.create({
    main: {
        marginTop: 32
    },

    img: {
        alignSelf: "center"
    },

    headerText: {
        fontFamily: fonts.regular,
        fontSize: 24
    },

    pText: {
        fontFamily: fonts.light,
        fontSize: 18
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
        padding: 24
    },

    otpPaddingHorizontal: {
        paddingHorizontal: 24
    },

    lText: {
        color: "#008000",
        fontFamily: fonts.bold,
        fontSize: 16
    }
})
