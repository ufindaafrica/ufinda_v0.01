import { StyleSheet } from "react-native";
import { moderateScale, scale, verticalScale } from "@/deps/scale";

export const otpStyles = StyleSheet.create({
    main: {
        marginTop: verticalScale(32)
    },

    img: {
        alignSelf: "center",
        height: scale(194),
        width: scale(194)
    },

    pText: {
        width: scale(259)
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
        padding: moderateScale(16)
    },

    otpPaddingHorizontal: {
        paddingHorizontal: moderateScale(16)
    },

    lText: {
        color: "#008000"
    },

    otpPaddingMedium: {
        paddingTop: moderateScale(16)
    }
})
