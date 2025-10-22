import { StyleSheet } from "react-native";
import { fonts } from "../globals";


export const selectStyles = StyleSheet.create({

    box: {
        width: "100%",
        height: 50,
        borderColor: "#008000",
        borderWidth: 1.5,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row"
    },

    text: {
        color: "#008000",
        fontFamily: fonts.regular
    },

    activeBox: {
        backgroundColor: "#008000"
    },

    activeText: {
        color: "#f5f5f5"
    },

    clickable: {
        opacity: 0.5,
        borderWidth: 0
    },

    icon: {
        marginRight: 10
    }
    
})
