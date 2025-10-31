import { StyleSheet } from "react-native";
import { fonts } from "../globals";


export const errorModalStyles = StyleSheet.create({
    main: {
        height: 250,
        width: 300,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "#f5f5f5",
        borderRadius: 15,
        elevation: 5,
        zIndex: 5
    },

    buttonV: {
        width: "60%"
    },

    mainV: {
        width: "100%",
        height: "100%",
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(240, 240, 240, 0.5)",
    },

    text: {
        fontFamily: fonts.regular,
        paddingVertical: 15,
        overflow: "scroll",
        width: "90%",
        textAlign: "center",
        fontSize: 16
    }
})
