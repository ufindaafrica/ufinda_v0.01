import AppHeader from "@/components/appHeader";
import Filter from "@/components/filter";
import Search from "@/components/search";
import { globals } from "@/styles/globals";
import { homeStyles } from "@/styles/home";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";



export default function Home () {
    
    return (
        <SafeAreaView style={[globals.container, globals.authContainer]}>
            <View style={homeStyles.layoutMargin}>
                <AppHeader />
            </View>

            <View style={homeStyles.layoutMargin}>
                <Search />
            </View>

            <View>
                <Filter options={["Near You", "Recommended", "Others"]} />
            </View>
        </SafeAreaView>
    )
}

