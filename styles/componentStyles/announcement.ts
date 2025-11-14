import { StyleSheet } from "react-native";


export const announcementStyles = StyleSheet.create({
    main: {
        width: "100%",
        height: 104,
        borderWidth: 2,
        borderRadius: 16,
        borderColor: "#008000",
        justifyContent: 'space-between',
        padding: 16,
        flexDirection: "row"
    },

    activeMain: {
        backgroundColor: "#008000",
        borderWidth: 0
    },

    touch: {
        width: 44,
        height: 44,
        borderRadius: 30,
        backgroundColor: "#fcfcfc",
        justifyContent: "center",
        alignItems: "center",
        alignContent: "center",
        alignSelf: "center"
    },

    activeTouch: {
        backgroundColor: '#008000'
    },

    img: {
        width: 24,
        height: 24
    }
})
