import Announcement from "@/components/announcement";
import LineBreak from "@/components/lineBreak";
import Plus from "@/components/plus";
import VendorAppHeader from "@/components/vendorAppHeader";
import { images } from "@/constants/images";
import { dashboardStyles } from "@/styles/dashboard";
import { globals, roboto } from "@/styles/globals";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function Dashboard() {

    const allAds = () => {
        return <View style={{justifyContent: "space-between"}}>
            <Text style={[roboto.bodySmallBold]}>All Ads</Text>
            <View style={{flexDirection: "row", alignItems: "flex-end"}}>
                <Text style={[roboto.headlineLargeBold, { paddingRight: 8}]}>12</Text>
                <Text style={[{ color: "#546881", paddingBottom: 3}, roboto.bodySmall]}>Published</Text>
            </View>
        </View>
    }

    const appointments = () => {
        return (
            <View>
                <Text style={[roboto.titleSmall, { color: "#fcfcfc", width: 255, paddingBottom: 16 }]}>You have an appointment tomorrow</Text>
                <Text style={[roboto.bodyMedium, { color: "#e5e5ea" }]}>Set reminder</Text>
            </View>
        )
    }

    return (
        <SafeAreaView style={[globals.vendorContainer]}>
            <Plus />

            <VendorAppHeader />

            <LineBreak />

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <Announcement view={appointments()} active />
                <Announcement view={allAds()} />
            </ScrollView>
        </SafeAreaView>
    )
}

