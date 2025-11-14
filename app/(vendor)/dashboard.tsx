import { Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";


export default function Dashboard () {

    return (
            <SafeAreaView>
                <View style={dashboardStyles.plusView}></View>
            </SafeAreaView>
    )
}

