import CircleProgress from "@/components/circleProgress";
import Plus from "@/components/plus";
import { globals } from "@/styles/globals";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Ads() {

    return (
        <SafeAreaView style={[globals.container, globals.homeContainer]}>
            <Plus />

            <Text>HI</Text>

            <CircleProgress progress={10} totalProgress={12} />
            
        </SafeAreaView>
    )
}
