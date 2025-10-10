import { StyleSheet } from "react-native";
import { fonts } from "./globals";


export const onboardingStyles = StyleSheet.create({
    container: {
        backgroundColor: "#f5f5f5",
        display: "flex",
        flex: 1,
        justifyContent: "space-evenly",
        alignItems: "center"
    },

    pressable: {
        flex: 1,
        width: "100%",
        height: "100%",
        justifyContent: "space-evenly",
        alignItems: "center"
    },

    logo: {
        backgroundColor: "#fcfcfc",
        width: 170,
        height: 32,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 10
    },

    textView: {
        justifyContent: "center",
        alignItems: "center",
        width: "72%"
    },

    header: {
        fontFamily: fonts.bold,
        fontSize: 28,
        textAlign: "center",
        lineHeight: 36,
        marginBottom: 10,
        color: "#101010"
    },

    regular: {
        fontFamily: fonts.light,
        fontSize: 14,
        textAlign: "center",
        color: "#546881"
    },

    dots: {
        flexDirection: "row",
        width: "8%",
        justifyContent: "space-between"
    },

    button: {
        backgroundColor: "#101010",
        width: "85%",
        height: "5%",
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center"
    },

    buttonText: {
        color: "#f5f5f5",
        fontFamily: fonts.regular,
        fontSize: 16
    }
})
