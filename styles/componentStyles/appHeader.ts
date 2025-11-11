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
        height: 24,
        width: 24
    },

    textTouch: {
        width: 84,
        height: 30,
        paddingVertical: 8,
        paddingHorizontal: 24,
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
