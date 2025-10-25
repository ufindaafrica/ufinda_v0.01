import { StyleSheet } from "react-native";
import { fonts } from "../globals";


export const filterStyles = StyleSheet.create({
    visibleV: {
        flexDirection: "row",
        width: "100%",
        justifyContent: 'space-between',
        backgroundColor: "#fffffa",
        alignItems: "center",
        borderRadius: 15
    },

    text: {
        fontFamily: fonts.regular,
        fontSize: 18,
        padding: 10,
        color: "#363333"
    },

    img: {
        marginRight: 5
    },

    visibleDropDown: {
        width: "100%",
        justifyContent: 'space-between',
        backgroundColor: "#fffffa",
        borderRadius: 15,
        elevation: 5,
        position: "absolute"
    },

    input: {
        width: "100%"
    }

})
