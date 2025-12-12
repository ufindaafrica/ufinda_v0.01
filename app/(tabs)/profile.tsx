import MemberProfile from "@/components/memberProfile";
import { globals } from "@/styles/globals";
import { SafeAreaView } from "react-native-safe-area-context";


export default function Profile () {

    return (
        <SafeAreaView style={[globals.container, globals.lightContainer]}>
            <MemberProfile />
        </SafeAreaView>
    )
}

