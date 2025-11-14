import Plus from "@/components/plus";
import { globals } from "@/styles/globals";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Ads() {

    return (
        <SafeAreaView style={[globals.container, globals.homeContainer]}>
            <Plus />
        </SafeAreaView>
    )
}
