import { StyleSheet } from "react-native";
import { fonts } from "./globals";

export const picStyles = StyleSheet.create({

    main: {
        marginTop: 32
    },

    headerText: {
        fontFamily: fonts.regular,
        fontSize: 24
    },

    pText: {
        fontFamily: fonts.light,
        fontSize: 18,
        marginTop: 5
    },

    imgV: {
        borderWidth: 1.5,
        height: 200,
        width: 200,
        borderRadius: 150,
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center"
    },

    imgO: {
        backgroundColor: "#f2f2f7",
        height: "90%",
        width: "90%",
        borderRadius: 150,
        justifyContent: "center",
        alignItems: "center"
    },

    fileText: {
        fontFamily: fonts.regular
    },

    descHeader: {
        flexDirection: "row",
        justifyContent: "space-between"
    },

    descText: {
        fontFamily: fonts.regular
    },

    descInput: {
        borderWidth: 1,
        borderColor: "#b3b3b3",
        borderRadius: 10,
        marginTop: 10,
        height: 70,
        textAlignVertical: "top",
        fontSize: 18,
        width: "100%",
        flexShrink: 1
    },

    linkText: {
        alignSelf: "center",
        fontFamily: fonts.bold,
        color: "#008000"
    },

    previewImage: {
        height: "100%",
        width: "100%",
        borderRadius: 150
    }

})
