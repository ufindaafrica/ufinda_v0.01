import AppHeader from "@/components/appHeader";
import Search from "@/components/search";
import { images } from "@/constants/images";
import { globals } from "@/styles/globals";
import { homeStyles } from "@/styles/home";
import { Image, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { SearchBar } from "react-native-screens";


export default function Shop() {

    return (
        <SafeAreaProvider>
            <SafeAreaView style={globals.homeContainer}>
                <View style={homeStyles.layoutMargin}>
                    <AppHeader shop />
                </View>
                {/* <View style={{ justifyContent: "center", height: "85%", width: "100%", alignItems: "center" }}>
                    <Image source={images.comingSoon} style={{ width: 243, height: 243 }} />
                </View> */}

                <View style={[homeStyles.layoutMargin, {flexDirection: 'row', justifyContent: 'space-between', alignContent: 'center'}]}>
                    <View style={{width: "85%"}}>
                        <Search />
                    </View>
                    <TouchableOpacity style={{width: 44, height: 44, backgroundColor: "#ffffff", borderRadius: 30, justifyContent: 'center', alignItems: 'center'}}>
                        <Image source={images.sort} style={{width: 24, height: 24}} />
                    </TouchableOpacity>
                </View>

                {/* category list view */}
                <View></View>


            </SafeAreaView>
        </SafeAreaProvider>
    )
}
