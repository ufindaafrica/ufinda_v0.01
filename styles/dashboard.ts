import { StyleSheet } from "react-native";


export const dashboardStyles = StyleSheet.create({
    plusV: {
        backgroundColor: "#d9ecd9",
        width: 64,
        height: 64,
        borderRadius: 45,
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        bottom: 16,
        right: 16,
        zIndex: 2,
        elevation: 2
    },

    plusImg: {
        width: 35,
        height: 35
    },

    padding: {
        padding: 16
    },

    scrollV: { 
        paddingVertical: 16, 
        paddingBottom: 100 
    },

    listingsV: {
        flexDirection: "row", 
        flexWrap: "wrap", 
        justifyContent: "space-between", 
        rowGap: 2 
    },

    eachListing: {
        height: 174, 
        width: 175, 
        borderWidth: 1, 
        borderColor: "#f2f2f7", 
        borderRadius: 16, 
        padding: 16,
        justifyContent: "space-between"
    },

    outerRemV: { 
        width: 143, 
        height: 8, 
        backgroundColor: "#f2f2f7", 
        borderRadius: 30, 
        marginTop: 16
    },

    postedT: { 
        color: "#546881", 
        paddingTop: 4
    },

    remEntireV: {
        flexDirection: "row", 
        alignItems: "flex-end"
    },

    remT: { 
        color: "#546881", 
        paddingBottom: 3
    },

    innerRemV: {
        height: "100%", 
        backgroundColor: '#008000', 
        borderRadius: 30
    },

    metricImg: {
        width: 32,
        height: 32,
        alignSelf: "center"
    },

    metricT: {
        color: '#008000',
        alignSelf: 'flex-end'
    }
})
