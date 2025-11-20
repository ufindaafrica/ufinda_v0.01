import { StyleSheet } from "react-native";
import { moderateScale, verticalScale } from "@/deps/scale";

export const thumbnailStyles = StyleSheet.create({
    main: {
        backgroundColor: "#b3b3b3",
        height: verticalScale(140),
        borderRadius: 16,
        padding: moderateScale(10),
    },

    txt: {
        color: "#593a00",
        backgroundColor: "#fff6e6",
        paddingVertical: moderateScale(4),
        borderRadius: 6,
        paddingHorizontal: moderateScale(8),
        textAlign: "center",
        textAlignVertical: "center"
    },

    unavailable: {
        opacity: 0
    },

    txtV: {
        flexDirection: "row",
        justifyContent: "space-between"
    },

    bgStyle: {
        borderRadius: 16,
        resizeMode: "cover"
    }
})
