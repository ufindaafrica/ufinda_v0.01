import { StyleSheet } from "react-native";
import { fonts } from "../globals";


export const filterStyles = StyleSheet.create({
    visibleV: {
        flexDirection: "row",
        width: "100%",
        justifyContent: 'space-between',
        backgroundColor: "#fffffa",
        alignItems: "center",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#c7c7cc"
    },

    activeV: {
        borderColor: "#000000"
    },

    text: {
        padding: 10,
        color: "#546881"
    },

    img: {
        marginRight: 5,
        width: 16,
        height: 16,
        opacity: 0.5
    },

    activeImg: {
        opacity: 1
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
    },

    activeFilterText: {
        color: "#000000"
    }

})
