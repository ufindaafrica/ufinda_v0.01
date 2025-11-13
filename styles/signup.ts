import { StyleSheet } from "react-native";
import { fonts } from "./globals";


export const signupStyles = StyleSheet.create({

    firstInputLine: {
        flexDirection: "row",
        justifyContent: "space-between"
    },

    headerText: {
        color: "#000000"
    },

    pText: {
        width: 259,
        height: 40,
        paddingTop: 8
    },

    main: {
        padding: 16,
        height: "100%",
        justifyContent: "space-between"
    },

    eachName: {
        width: 150
    },

    policyView: {
        flexDirection: "row",
        width: 340,
        flexWrap: "wrap",
        alignContent: "center",
        justifyContent: "center",
        alignSelf: "center",
        paddingTop: 8
    },

    continueView: {
        paddingTop: 16
    },

    keyboardVisible: {
        paddingBottom: 40
    },

    layoutPadding: {
        paddingTop: 16
    },

    formPadding: {
        paddingTop: 16
    },

    passwordCheck: {
        flexDirection: "row",
        paddingBottom: 4,
        alignItems: "center"
    },

    passText: {
        color: "#bf0000"
    },

    validPassText: {
        color: "#008000"
    },

    mediumPassText: {
        color: "#cccc00"
    },

    icon: {
        marginRight: 5,
        height: 16,
        width: 16
    },

    altV: {
        marginTop: 8,
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
        height: 16,
        width: 16
    },

    remText: {
        paddingLeft: 4
    },

    forgotText: {
        color: "#008000"
    },

    orText: {
        color: "#b3b3b3",
        alignSelf: "center"
    },

    orV: {
        flexDirection: "row",
        alignItems: 'center',
        justifyContent: "space-between"
    },

    orImg: {
        width: 168,
        height: 2
    }, 

    bottomView: {
        position: "absolute",
        bottom: 0,
        alignSelf: "center",
        flexDirection: "row",
        width: "100%",
        alignItems: "center",
        justifyContent: "center"
    },

    passwordCheckV: {
        paddingTop: 7
    },

    policyPadding: {
        paddingTop: 8
    },

    grayText: {
        color: "#8e8e93"
    }

})
