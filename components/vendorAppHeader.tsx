import { images } from "@/constants/images";
import { vendorAppHeader } from "@/styles/componentStyles/vendorAppHeader";
import { roboto } from "@/styles/globals";
import { router } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

type VendorAppHeaderProps = {
    firstName: string,
    profileImg: string
}


export default function VendorAppHeader ({ firstName, profileImg } : VendorAppHeaderProps) {

    return (
        <View style={vendorAppHeader.main}>
            <View>
                <Text style={[roboto.titleLargeBold, vendorAppHeader.blackTxt]}>{`Welcome ${firstName ?? ""}`}</Text>
                <TouchableOpacity onPress={() => router.push("/vendorPages/newHostel")} style={vendorAppHeader.postV}>
                    <Text style={[roboto.bodyMedium, vendorAppHeader.greenTxt]}>Post an Ad</Text>
                    <Image source={images.arrowRight} style={vendorAppHeader.greenImg} />
                </TouchableOpacity>
            </View>
            <View style={vendorAppHeader.rightV}>
                <TouchableOpacity style={[vendorAppHeader.bellButton, vendorAppHeader.roundV]}>
                    <Image source={images.bell} style={vendorAppHeader.bellImg} />
                </TouchableOpacity>
                <TouchableOpacity style={[vendorAppHeader.roundV]}>
                    <Image source={profileImg ? {uri: profileImg} : images.user0} style={vendorAppHeader.roundV} />
                </TouchableOpacity>
            </View>
        </View>
    )
}
