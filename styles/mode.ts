import { verticalScale } from "@/deps/scale";
import { StyleSheet } from "react-native";

export const modeStyles = StyleSheet.create({

    textView: {
        paddingTop: verticalScale(8)
    },

    selectMode: {
        marginTop: verticalScale(8),
        height: verticalScale(150),
        justifyContent: "space-between"
    }
})
