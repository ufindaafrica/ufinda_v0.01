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
    },

    altV: {
        marginTop: 5,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },

    remV: {
        flexDirection: "row",
        alignItems: "center"
    },

    forgotV: {
        transform: [
            {
                translateY: -2.5
            }
        ]
    },

    remImg: {
        height: 20,
        width: 20
    },

    remText: {
        fontFamily: fonts.light,
        paddingLeft: 5,
        color: "#534e4e"
    },

    forgotText: {
        fontFamily: fonts.bold,
        color: "#008000"
    },

    orText: {
        fontFamily: fonts.light,
        fontSize: 18,
        color: "#b3b3b3",
        alignSelf: "center"
    },

    orPadding: {
        padding: 8
    },

    bottomView: {
        position: "absolute",
        bottom: 0,
        alignSelf: "center",
        flexDirection: "row",
        width: "100%",
        alignItems: "center",
        justifyContent: "center"
    }

})
