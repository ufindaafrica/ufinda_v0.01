import { StyleSheet } from "react-native";
import { fonts } from "./globals";
import { moderateScale, scale } from "@/deps/scale";


export const signupStyles = StyleSheet.create({

    firstInputLine: {
        flexDirection: "row",
        justifyContent: "space-between"
    },

    headerText: {
        color: "#000000"
    },

    pText: {
        width: scale(259),
        paddingTop: 8
    },

    main: {
        padding: moderateScale(16),
        height: "100%",
        justifyContent: "space-between"
    },

    eachName: {
        width: scale(150)
    },

    policyView: {
        flexDirection: "row",
        width: scale(340),
        flexWrap: "wrap",
        alignContent: "center",
        justifyContent: "center",
        alignSelf: "center",
        paddingTop: moderateScale(8)
    },

    continueView: {
        paddingTop: moderateScale(16)
    },

    keyboardVisible: {
        paddingBottom: moderateScale(40)
    },

    layoutPadding: {
        paddingTop: moderateScale(16)
    },

    formPadding: {
        paddingTop: moderateScale(16)
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
        marginRight: scale(5),
        height: scale(16),
        width: scale(16)
    },

    altV: {
        marginTop: moderateScale(8),
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
        height: scale(16),
        width: scale(16)
    },

    remText: {
        paddingLeft: moderateScale(4)
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
        width: scale(168),
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
        paddingTop: moderateScale(7)
    },

    policyPadding: {
        paddingTop: moderateScale(8)
    },

    grayText: {
        color: "#8e8e93"
    }

})
