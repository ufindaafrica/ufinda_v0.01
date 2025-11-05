import { StyleSheet } from "react-native";


export const selectStyles = StyleSheet.create({

    box: {
        width: "100%",
        height: 44,
        borderColor: "#008000",
        borderWidth: 1.5,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row"
    },

    text: {
        color: "#008000"
    },

    activeBox: {
        backgroundColor: "#006000",
        borderWidth: 0
    },

    activeText: {
        color: "#fcfcfc"
    },

    clickable: {
        opacity: 0.5,
        borderWidth: 0
    },

    icon: {
        marginRight: 10
    }
    
})
