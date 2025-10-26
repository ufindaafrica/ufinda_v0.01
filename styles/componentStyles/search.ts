import { StyleSheet } from "react-native";
import { fonts } from "../globals";


export const searchStyles = StyleSheet.create({
    main: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#e5e5ea",
        borderRadius: 25,
        padding: 3
    },

    img: {
        marginLeft: 5
    },

    text: {
        width: "90%",
        fontFamily: fonts.regular,
        fontSize: 14
    }
})
