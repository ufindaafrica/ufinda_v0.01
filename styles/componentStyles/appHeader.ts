import { moderateScale, scale, verticalScale } from "@/deps/scale";
import { StyleSheet } from "react-native";

export const appHeaderStyles = StyleSheet.create({
    main: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },

    textV: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    img: {
        height: scale(24),
        width: scale(24)
    },

    textTouch: {
        width: scale(84),
        height: verticalScale(34),
        paddingVertical: moderateScale(8),
        paddingHorizontal: moderateScale(24),
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 30
    },

    selectedText: {
        color: "#fffff7"
    },

    selectedTextTouch: {
        backgroundColor: "#008000"
    },

    text: {
        color: "#000000"
    }
})
