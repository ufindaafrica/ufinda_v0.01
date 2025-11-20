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
        justifyContent: "space-between",
        alignItems: "center"
    },

    header: {
        textAlign: "center",
        color: "#101010",
        width: 240
    },

    regular: {
        textAlign: "center",
        color: "#546881",
        width: 278
    },

    dots: {
        flexDirection: "row",
        width: "8%",
        justifyContent: "space-between"
    },

    button: {
        backgroundColor: "#101010",
        width: "95%",
        height: 44,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        padding: 10
    },

    buttonText: {
        color: "#f5f5f5",
    },

    img: {
        width: 170,
        height: 31.72
    },

    onImg: {
        width: 390,
        height: 420
    },

    onImg3: {
        alignSelf: "center",
        resizeMode: "center"
    },

    centerImg: {
        alignSelf: "center"
    },

    bottomV: {
        height: 198,
        justifyContent: "space-between",
        alignItems: "center",
        width: 358,
        paddingHorizontal: 16
    },

    dotImg: {
        width: 6,
        height: 6
    }
})
