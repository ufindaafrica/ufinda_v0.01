import { StyleSheet } from "react-native";
import { moderateScale } from "@/deps/scale";

export const fonts = {
    regular: "Inter_400Regular",
    bold: "Inter_700Bold",
    light: "Inter_300Light",
};

const robotoFonts = {
    regular: "Roboto_400Regular",
    bold: "Roboto_700Bold"
};

export const roboto = StyleSheet.create({
    display: {
        fontFamily: robotoFonts.regular,
        fontSize: moderateScale(34),
        lineHeight: moderateScale(41)
    },

    displayBold: {
        fontFamily: robotoFonts.bold,
        fontSize: moderateScale(34),
        lineHeight: moderateScale(41)
    },
    
    headingLarge: {
        fontFamily: robotoFonts.regular,
        fontSize: moderateScale(28),
        lineHeight: moderateScale(36)
    },

    headingLargeBold: {
        fontFamily: robotoFonts.bold,
        fontSize: moderateScale(28),
        lineHeight: moderateScale(36)
    },

    headingMedium: {
        fontFamily: robotoFonts.regular,
        fontSize: moderateScale(24),
        lineHeight: moderateScale(31)
    },

    headingMediumBold: {
        fontFamily: robotoFonts.bold,
        fontSize: moderateScale(24),
        lineHeight: moderateScale(31)
    },
    
    headingSmall: {
        fontFamily: robotoFonts.regular,
        fontSize: moderateScale(22),
        lineHeight: moderateScale(28)
    },

    headingSmallBold: {
        fontFamily: robotoFonts.bold,
        fontSize: moderateScale(22),
        lineHeight: moderateScale(28)
    },

    titleLarge: {
        fontFamily: robotoFonts.regular,
        fontSize: moderateScale(20),
        lineHeight: moderateScale(26)
    },

    titleLargeBold: {
        fontFamily: robotoFonts.bold,
        fontSize: moderateScale(20),
        lineHeight: moderateScale(26)
    },

    titleMedium: {
        fontFamily: robotoFonts.regular,
        fontSize: moderateScale(18),
        lineHeight: moderateScale(22)
    },

    titleMediumBold: {
        fontFamily: robotoFonts.bold,
        fontSize: moderateScale(18),
        lineHeight: moderateScale(22)
    },

    titleSmall: {
        fontFamily: robotoFonts.regular,
        fontSize: moderateScale(16),
        lineHeight: moderateScale(20)
    },

    titleSmallBold: {
        fontFamily: robotoFonts.bold,
        fontSize: moderateScale(16),
        lineHeight: moderateScale(20)
    },

    bodyLarge: {
        fontFamily: robotoFonts.regular,
        fontSize: moderateScale(16),
        lineHeight: moderateScale(22)
    },

    bodyLargeBold: {
        fontFamily: robotoFonts.bold,
        fontSize: moderateScale(16),
        lineHeight: moderateScale(22)
    },

    bodyMedium: {
        fontFamily: robotoFonts.regular,
        fontSize: moderateScale(14),
        lineHeight: moderateScale(20)
    },

    bodyMediumBold: {
        fontFamily: robotoFonts.bold,
        fontSize: moderateScale(14),
        lineHeight: moderateScale(20)
    },

    bodySmall: {
        fontFamily: robotoFonts.regular,
        fontSize: moderateScale(12),
        lineHeight: moderateScale(18)
    },

    bodySmallBold: {
        fontFamily: robotoFonts.bold,
        fontSize: moderateScale(12),
        lineHeight: moderateScale(18)
    },

    mediumEmphasized: {
        fontFamily: robotoFonts.regular,
        fontSize: moderateScale(12),
        lineHeight: moderateScale(16)
    },

    mediumEmphasizedBold: {
        fontFamily: robotoFonts.bold,
        fontSize: moderateScale(12),
        lineHeight: moderateScale(16)
    },

    caption: {
        fontFamily: robotoFonts.regular,
        fontSize: moderateScale(10),
        lineHeight: moderateScale(12)
    },

    captionBold: {
        fontFamily: robotoFonts.bold,
        fontSize: moderateScale(10),
        lineHeight: moderateScale(12)
    },

    headlineLarge: {
        fontFamily: robotoFonts.regular,
        fontSize: moderateScale(28),
        lineHeight: moderateScale(34)
    },

    headlineLargeBold: {
        fontFamily: robotoFonts.bold,
        fontSize: moderateScale(28),
        lineHeight: moderateScale(34)
    },

    headlineMedium: {
        fontFamily: robotoFonts.regular,
        fontSize: moderateScale(25),
        lineHeight: moderateScale(30)
    },

    headlineMediumBold: {
        fontFamily: robotoFonts.bold,
        fontSize: moderateScale(25),
        lineHeight: moderateScale(30)
    },

    headlineSmall: {
        fontFamily: robotoFonts.regular,
        fontSize: moderateScale(22),
        lineHeight: moderateScale(26)
    },

    headlineSmallBold: {
        fontFamily: robotoFonts.bold,
        fontSize: moderateScale(22),
        lineHeight: moderateScale(26)
    },
});

export const globals = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5"
    },

    text: {
        fontFamily: "System",
        fontSize: moderateScale(30)
    },

    authContainer: {
        padding: moderateScale(16)
    },

    homeContainer: {
        padding: moderateScale(16),
        backgroundColor: "#f5f5f5"
    },

    vendorContainerPadding: {
        padding: moderateScale(16)
    },

    vendorContainer: {
        backgroundColor: "#fcfcfc",
        flex: 1
    },

    lightContainer: {
        backgroundColor: '#fcfcfc'
    }
});

export const colors = StyleSheet.create({
    grays: {
        color: "#8e8e93"
    },

    foundationWarningDark: {
        color: "#008000"
    },

    black: {
        color: "#000000"
    },

    darkBurntOrange: {
        color: "#be7c00"
    },

    foundationPrimaryNormal: {
        color: "#546881"
    },

    white: {
        color: '#ffffff'
    }
});
