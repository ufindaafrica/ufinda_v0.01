import { StyleSheet } from "react-native";

export const fonts = {
    regular: "Inter_400Regular",
    bold: "Inter_700Bold",
    light: "Inter_300Light",
}

const robotoFonts = {
    regular: "Roboto_400Regular",
    bold: "Roboto_700Bold"
}

export const roboto = StyleSheet.create({
    display: {
        fontFamily: robotoFonts.regular,
        fontSize: 34,
        lineHeight: 41
    },

    displayBold: {
        fontFamily: robotoFonts.bold,
        fontSize: 34,
        lineHeight: 41
    },

    headingLarge: {
        fontFamily: robotoFonts.regular,
        fontSize: 28,
        lineHeight: 36
    },

    headingLargeBold: {
        fontFamily: robotoFonts.bold,
        fontSize: 28,
        lineHeight: 36
    },

    headingMedium: {
        fontFamily: robotoFonts.regular,
        fontSize: 24,
        lineHeight: 31
    },

    headingMediumBold: {
        fontFamily: robotoFonts.bold,
        fontSize: 24,
        lineHeight: 31
    },

    headingSmall: {
        fontFamily: robotoFonts.regular,
        fontSize: 22,
        lineHeight: 28
    },

    headingSmallBold: {
        fontFamily: robotoFonts.bold,
        fontSize: 22,
        lineHeight: 28
    },

    titleLarge: {
        fontFamily: robotoFonts.regular,
        fontSize: 20,
        lineHeight: 26
    },

    titleLargeBold: {
        fontFamily: robotoFonts.bold,
        fontSize: 20,
        lineHeight: 26
    },

    titleMedium: {
        fontFamily: robotoFonts.regular,
        fontSize: 18,
        lineHeight: 22
    },

    titleMediumBold: {
        fontFamily: robotoFonts.bold,
        fontSize: 18,
        lineHeight: 22
    },

    titleSmall: {
        fontFamily: robotoFonts.regular,
        fontSize: 16,
        lineHeight: 20
    },

    titleSmallBold: {
        fontFamily: robotoFonts.bold,
        fontSize: 16,
        lineHeight: 20
    },

    bodyLarge: {
        fontFamily: robotoFonts.regular,
        fontSize: 16,
        lineHeight: 22
    },

    bodyLargeBold: {
        fontFamily: robotoFonts.bold,
        fontSize: 16,
        lineHeight: 22
    },

    bodyMedium: {
        fontFamily: robotoFonts.regular,
        fontSize: 14,
        lineHeight: 20
    },

    bodyMediumBold: {
        fontFamily: robotoFonts.bold,
        fontSize: 14,
        lineHeight: 20
    },

    bodySmall: {
        fontFamily: robotoFonts.regular,
        fontSize: 12,
        lineHeight: 18
    },

    bodySmallBold: {
        fontFamily: robotoFonts.bold,
        fontSize: 12,
        lineHeight: 18
    },

    mediumEmphasized: {
        fontFamily: robotoFonts.regular,
        fontSize: 12,
        lineHeight: 16
    },

    mediumEmphasizedBold: {
        fontFamily: robotoFonts.bold,
        fontSize: 12,
        lineHeight: 16
    },

    caption: {
        fontFamily: robotoFonts.regular,
        fontSize: 10,
        lineHeight: 12
    },

    captionBold: {
        fontFamily: robotoFonts.bold,
        fontSize: 10,
        lineHeight: 12
    }

})

export const globals = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5"
    },
    
    text: {
        fontFamily: "System",
        fontSize: 30
    },

    authContainer: {
        padding: 16
    },

    homeContainer: {
        padding: 16,
        backgroundColor: "#f5f5f5"
    },

    vendorContainerPadding: {
        padding: 16
    },

    vendorContainer: {
        backgroundColor: "#fcfcfc",
        flex: 1
    }
});

export const colors = StyleSheet.create({
    grays: {
        color: "#8e8e93"
    },

    foundationWarningDark: {
        color: "#008000"
    }
})
