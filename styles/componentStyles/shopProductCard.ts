import { moderateScale, scale, verticalScale } from "@/deps/scale";
import { StyleSheet } from "react-native";

export const shopProductCardStyles = StyleSheet.create({
    card: {
        width: scale(160),
        marginRight: moderateScale(12),
    },

    imageWrap: {
        width: "100%",
        height: verticalScale(120),
        borderRadius: 12,
        backgroundColor: "#f5d4b8",
        marginBottom: moderateScale(8),
        position: "relative",
    },

    saveButton: {
        position: "absolute",
        top: moderateScale(8),
        right: moderateScale(8),
        padding: moderateScale(4),
    },

    saveIcon: {
        width: scale(20),
        height: scale(20),
    },

    title: {
        color: "#000000",
        marginBottom: moderateScale(4),
    },

    price: {
        color: "#000000",
    },
});
