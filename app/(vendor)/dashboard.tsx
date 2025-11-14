import Plus from "@/components/plus";
import VendorAppHeader from "@/components/vendorAppHeader";
import { images } from "@/constants/images";
import { dashboardStyles } from "@/styles/dashboard";
import { globals } from "@/styles/globals";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";


export default function Dashboard () {

    return (
            <SafeAreaView style={[globals.vendorContainer]}>
                <Plus />

                <VendorAppHeader />
            </SafeAreaView>
    )
}

