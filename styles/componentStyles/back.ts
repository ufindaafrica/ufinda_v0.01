import { scale, verticalScale } from "@/deps/scale";
import { StyleSheet } from "react-native";


export const backStyles = StyleSheet.create({

    img: {
        height: verticalScale(12),
        width: scale(6)
    },

    arrowV: {
        height: scale(44),
        width: scale(44),
        justifyContent: "center"
    },

    large: {
        width: scale(24),
        height: scale(24)
    }
})
