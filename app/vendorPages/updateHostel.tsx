import BackArrow from "@/components/back";
import Input from "@/components/input";
import LineBreak from "@/components/lineBreak";
import Loader from "@/components/loader";
import Select from "@/components/select";
import { moderateScale } from "@/deps/scale";
import { toast } from "@/deps/toast";
import { getStudentInfo, getVendorInfo } from "@/services/getStudentInfo";
import { globals, roboto } from "@/styles/globals";
import { idStyles } from "@/styles/id";
import { signupStyles } from "@/styles/signup";
import { router, useLocalSearchParams } from "expo-router";
import { getItem, getItemAsync } from "expo-secure-store";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaProvider, SafeAreaView, useSafeAreaFrame } from "react-native-safe-area-context";


export default function UpdateHostel() {

    const { id, hostel } = useLocalSearchParams()
    const idString = Array.isArray(id) ? id[0] : id
    const hostelDets = JSON.parse(Array.isArray(hostel) ? hostel[0] : hostel)

    console.log(hostelDets)

    const [landlordResides, setLandlordResides] = useState(hostelDets?.landlord_resides)
    const [roommatesAllowed, setRoommatesAllowed] = useState(hostelDets?.roommates_allowed)
    const [description, setDescription] = useState(hostelDets?.description)
    const [powerSupply, setPowerSupply] = useState(hostelDets?.power_supply)
    const [availableRooms, setAvailableRooms] = useState(hostelDets?.available_rooms.toString())
    const [isAvailable, setIsAvailable] = useState(Number(availableRooms) > 0 ? true : false)


    const [loaderVisible, setLoaderVisible] = useState(false)

    


    return (
        <SafeAreaProvider style={[globals.container, globals.lightContainer]}>
            <SafeAreaView style={[globals.container, globals.lightContainer]}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                        <View style={[idStyles.headerV, { paddingBottom: 0 }]}>
                            <View style={idStyles.firstHeaderV}>
                                <BackArrow backFun={() => router.back()} large />
                                <Text style={roboto.titleLargeBold}>Update Hostel</Text>
                            </View>
                        </View>
                        <LineBreak />
                        <KeyboardAwareScrollView
                        contentContainerStyle={{
                            flexGrow: 1, paddingBottom: 40
                        }}
                        style={{ flex: 1 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        enableOnAndroid={true}
                        extraScrollHeight={15}
                    >
                        <ScrollView style={{ flex: 1 }}>
                            <View style={[signupStyles.formPadding, { paddingHorizontal: moderateScale(16) }]}>
                                <Input
                                    label="Number of Available Rooms:"
                                    value={availableRooms}
                                    editable={true}
                                    onChangeText={(text) => setAvailableRooms(text)}
                                    keyboardType="number-pad" />
                            </View>
                            <View style={[signupStyles.formPadding, { paddingHorizontal: moderateScale(16) }]}>
                                <Input
                                    label="Landlord Resides:"
                                    value={landlordResides}
                                    editable={true}
                                    onChangeText={(text) => setLandlordResides(text)} />
                            </View>
                            <View style={[signupStyles.formPadding, { paddingHorizontal: moderateScale(16) }]}>
                                <Input
                                    label="Roommates Allowed:"
                                    value={roommatesAllowed}
                                    editable={true}
                                    onChangeText={(text) => setRoommatesAllowed(text)} />
                            </View>
                            <View style={[signupStyles.formPadding, { paddingHorizontal: moderateScale(16) }]}>
                                <Input
                                    label="Power Supply:"
                                    value={powerSupply}
                                    editable={true}
                                    onChangeText={(text) => setPowerSupply(text)} />
                            </View>
                            <View style={[signupStyles.formPadding, { paddingHorizontal: moderateScale(16) }]}>
                                <Input
                                    label="Description:"
                                    value={description}
                                    editable={true}
                                    multilineInput={true}
                                    onChangeText={(text) => setDescription(text)}
                                    returnKeyType="next"
                                    submitBehavior="newline"
                                />
                            </View>


                            <View style={{ padding: moderateScale(16), paddingTop: moderateScale(24) }}>
                                <Select text="Update Hostel" selected selectFun={() => router.back()} />
                            </View>
                        </ScrollView>
                        {
                            loaderVisible ? <Loader /> : null
                        }
                    </KeyboardAwareScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </SafeAreaProvider>
    )
}
