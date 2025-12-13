import { SafeAreaView } from "react-native-safe-area-context";
import Shop from "../shop/shop";
import { globals } from "@/styles/globals";


export default function Add () {

    return (
        <SafeAreaView style={[globals.container]}>
            <Shop />
        </SafeAreaView>
    )
}

