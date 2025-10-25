import { StyleSheet } from "react-native";
import { fonts } from "../globals";

export const appHeaderStyles = StyleSheet.create({
    main: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },

    textV: {
        flexDirection: "row",
        justifyContent: "space-between",
        // flexGrow: 1
    },

    img: {
        // flexGrow: 1
    },

    text: {
        fontFamily: fonts.bold,
        paddingLeft: 22,
        paddingRight: 22,
        paddingTop: 5,
        paddingBottom: 5,
        borderRadius: 25
    },

    selectedText: {
        backgroundColor: "#008000",
        color: "#fffff7"
    }
})
