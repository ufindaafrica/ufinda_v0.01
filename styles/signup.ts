import { StyleSheet } from "react-native";
import { fonts } from "./globals";


export const signupStyles = StyleSheet.create({

    firstInputLine: {
        flexDirection: "row",
    },

    break: {
        width: "3%"
    },

    headerText: {
        fontFamily: fonts.regular,
        fontSize: 28
    },

    pText: {
        fontFamily: fonts.light,
        fontSize: 18
    },

    main: {
        padding: 24,
        height: "100%",
        justifyContent: "space-between"
    },

    eachName: {
        flexGrow: 1,
        width: 150
    },

    policyView: {
        flexDirection: "row",
        maxWidth: "100%",
        flexWrap: "wrap",
        alignContent: "center",
        justifyContent: "center"
    },

    policyText: {
        fontFamily: fonts.light
    },

    continueView: {
        paddingTop: 10
    },

    keyboardVisible: {
        paddingBottom: 40
    },

    layoutPadding: {
        paddingTop: 36
    },

    formPadding: {
        paddingTop: 24
    },

    passwordCheck: {
        flexDirection: "row",
        padding: 3,
        alignItems: "center"
    },

    passText: {
        fontFamily: fonts.regular,
        color: "#bf0000"
    },

    validPassText: {
        fontFamily: fonts.light,
        color: "#008000"
    },

    mediumPassText: {
        fontFamily: fonts.light,
        color: "#cccc00"
    },

    icon: {
        marginRight: 5,
        height: 12,
        width: 12
    }

})
