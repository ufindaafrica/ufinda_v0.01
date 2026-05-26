import { moderateScale, scale, verticalScale } from "@/deps/scale";
import { StyleSheet } from "react-native";

export const shopStyles = StyleSheet.create({
    layoutMargin: {
        marginBottom: moderateScale(16),
    },

    searchRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: moderateScale(8),
    },

    searchInputWrap: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#e5e5ea",
        borderRadius: 30,
        height: verticalScale(44),
        paddingHorizontal: moderateScale(12),
    },

    searchIcon: {
        width: scale(16),
        height: scale(16),
        marginRight: moderateScale(8),
    },

    searchInput: {
        flex: 1,
        color: "#000000",
    },

    filterButton: {
        width: scale(44),
        height: verticalScale(44),
        borderRadius: 30,
        backgroundColor: "#e5e5ea",
        alignItems: "center",
        justifyContent: "center",
    },

    filterBar: {
        width: scale(18),
        height: 2,
        backgroundColor: "#546881",
        borderRadius: 1,
        marginVertical: 2,
    },

    categoryGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        rowGap: moderateScale(16),
    },

    categoryItem: {
        width: "23%",
        alignItems: "center",
    },

    categoryIcon: {
        width: scale(56),
        height: scale(56),
        borderRadius: 12,
        backgroundColor: "#e5e5ea",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: moderateScale(6),
    },

    categoryIconImage: {
        width: scale(28),
        height: scale(28),
        resizeMode: "contain",
    },

    categoryLabel: {
        color: "#000000",
        textAlign: "center",
    },

    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: moderateScale(12),
    },

    sectionTitle: {
        color: "#000000",
    },

    viewAll: {
        color: "#008000",
    },

    dealsList: {
        paddingBottom: moderateScale(8),
    },

    scrollContent: {
        paddingBottom: verticalScale(120),
    },
});
