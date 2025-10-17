import { StyleSheet } from "react-native";
import { fonts } from "./globals";

export const modeStyles = StyleSheet.create({
    
    headerText: {
        fontSize: 32,
        fontFamily: fonts.regular
    },

    pText: {
        fontSize: 24,
        paddingTop: 5,
        fontFamily: fonts.light
    },

    textView: {
        paddingTop: 24
    },

    selectMode: {
        paddingTop: 36,
        height: "25%",
        justifyContent: "space-around"
    }
})
