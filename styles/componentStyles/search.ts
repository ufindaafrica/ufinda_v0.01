import { StyleSheet } from "react-native";
import { fonts } from "../globals";


export const searchStyles = StyleSheet.create({
    main: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#e5e5ea",
        borderRadius: 30,
        height: 44,
        width: "100%"
    },

    img: {
        marginLeft: 5,
        height: 16, 
        width: 16
    },

    text: {
        width: "90%"
    }
})
