import { StyleSheet } from "react-native";
import { fonts } from "./globals";


export const homeStyles = StyleSheet.create({
    layoutMargin: {
        marginBottom: 16
    },

    filterV: {
        flexDirection: "row",
        flexWrap: "wrap"
    },

    eachFilterV: {
        width: "50%",
        padding: 5
    },

    currentOptionTxt: {
        fontSize: 20,
        fontFamily: fonts.regular
    }
})

