import HostelLabel from "@/components/hostelLabel";
import Input from "@/components/input";
import LineBreak from "@/components/lineBreak";
import Select from "@/components/select";
import { images } from "@/constants/images";
import { pickMedia } from "@/deps/pickImage";
import { moderateScale, scale, verticalScale } from "@/deps/scale";
import { colors, globals, roboto } from "@/styles/globals";
import { newHostelStyles } from "@/styles/newHostel";
import { useEffect, useRef, useState } from "react";
import { Alert, Image, Keyboard, Platform, Text, ToastAndroid, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser"
import * as Location from "expo-location"
import Drawer from "@/components/drawer";
import { TextInput } from "react-native";


export default function NewHostel() {

    const [title, setTitle] = useState("")
    const categories = "Hostels"
    const [address, setAddress] = useState("")
    const [hostelType, setHostelType] = useState("")
    const [numberOfRooms, setNumberOfRooms] = useState("")
    const [totalRooms, setTotalRooms] = useState("")
    const [roomate, setRoomate] = useState("")
    const [power, setPower] = useState("")
    const [kitchen, setKitchen] = useState("")
    const [toilet, setToilet] = useState("")
    const [landlord, setLandlord] = useState("")
    const [desc, setDesc] = useState("")
    const [yearlyrent, setYearlyRent] = useState("")
    const [totalPrice, setTotalPrice] = useState("")
    const [bulkPrice, setBulkPrice] = useState("")

    const [descLength, setDescLength] = useState("0")
    const [adPrice, setAdPrice] = useState("2,999")

    type Media = {
        media: string;
        mediaName: string | null | undefined;
        mediaType: string;
    };

    type Error = {
        error: string
    }

    const [hostelImages, setHostelImages] = useState<(Media | Error | null)[]>([
        null, null, null, null, null
    ]);

    const [hostelVideo, setHostelVideo] = useState<Media | Error | null>(null)

    const getMedia = async (type: "image" | "video", idx: number = 0) => {

        const media = await pickMedia(type)

        if ("media" in media) {
            if (type === "image") {
                setHostelImages(prev => {
                    const newList = [...prev]
                    newList[idx] = media
                    return newList
                })
            }

            if (type === "video") {
                setHostelVideo(media)
            }
        }

        else {
            const message = media.error

            if (Platform.OS === "android") {
                ToastAndroid.show(message, ToastAndroid.CENTER)
            } else {
                Alert.alert("", message)
            }
        }

    }

    const onContinue = async () => {
        console.log("title", title)
        console.log("categories", categories)
        console.log("photos", hostelImages)
        console.log("video", hostelVideo)
        console.log("address", address)
        console.log("hostel type", hostelType)
        console.log("number of rooms", numberOfRooms)
        console.log("total rooms", totalRooms)
        console.log("roomate", roomate)
        console.log("power supply", power)
        console.log("kitchen access", kitchen)
        console.log("toilet access", toilet)
        console.log("landlord resides", landlord)
        console.log("description", desc)
        console.log("yearly rent", yearlyrent)
        console.log("total price", totalPrice)
        console.log('bulk price', bulkPrice)
        console.log('ad price', adPrice)
    }

    // useEffect(() => {
    //     const getLocation = async () => {
    //         const { status } = await Location.requestForegroundPermissionsAsync()
    //         if (status != "granted") {
    //             return
    //         }

    //         const loc = await Location.getCurrentPositionAsync({})
    //         console.log("got the first one")
    //         const address = await Location.reverseGeocodeAsync(loc.coords)

    //         console.log(loc)
    //         console.log(address)

    //         if (address.length > 0) {
    //             console.log(address[0])
    //             const formatted = address[0].formattedAddress + ""
    //             setAddress(formatted)
    //             // setFinalAddress(addr[0].city + ", " + addr[0].region)
    //         }
    //     }
    //     getLocation()
    // }, [])

    const [drawer, setDrawer] = useState(false)
    const [roomateDrawer, setRoomateDrawer] = useState(false)
    const [kitchenDrawer, setKitchenDrawer] = useState(false)
    const [powerDrawer, setPowerDrawer] = useState(false)
    const [toiletDrawer, setToiletDrawer] = useState(false)
    const [landlordDrawer, setLandlordDrawer] = useState(false)

    const [topAdView, setTopAdView] = useState(false)
    const [top7View, setTop7View] = useState(false)
    const [top30View, setTop30View] = useState(false)

    const [bottomAdView, setBottomAdView] = useState(false)

    const clickAdView = (view: "top" | "7" | "30" | "bottom") => {

        if (view === "top") {
            setTopAdView(true)
            if (!top7View && !top30View) {
                setTop7View(true)
                setAdPrice("2,999")
            }
            setBottomAdView(false)
        }

        if (view === "30") {
            setTop30View(true)
            setTopAdView(true)
            setTop7View(false)
            setBottomAdView(false)
            setAdPrice("9,999")
        }

        if (view === "7") {
            setTop7View(true)
            setTopAdView(true)
            setTop30View(false)
            setBottomAdView(false)
            setAdPrice("2,999")
        }

        if (view === "bottom") {
            setBottomAdView(true)
            setTopAdView(false)
            setTop7View(false)
            setTop30View(false)
        }

    }

    useEffect(() => {
        clickAdView("top")
    }, [])

    const availableRoomsRef = useRef<TextInput | null>(null)
    const totalRoomsRef = useRef<TextInput | null>(null)
    const descriptionRef = useRef<TextInput | null>(null)
    const yearlyRentRef = useRef<TextInput | null>(null)
    const totalPriceRef = useRef<TextInput | null>(null)
    const bulkPriceRef = useRef<TextInput | null>(null)
    const scrollRef = useRef<KeyboardAwareScrollView | null>(null)

    const focusNext = (nextRef: React.RefObject<TextInput | null>) => {
        const nextInput = nextRef.current
        if (!nextInput) return
        nextInput.focus()
        scrollRef.current?.scrollToFocusedInput(nextInput, verticalScale(150))
    }

    return (
        <SafeAreaView style={globals.vendorContainer}>
            <View style={newHostelStyles.headerV}>
                <Text style={roboto.titleLargeBold}>Publish an Ad</Text>
                <TouchableOpacity style={newHostelStyles.moreV}>
                    <Image source={images.more} style={newHostelStyles.moreImg} />
                </TouchableOpacity>
            </View>
            <KeyboardAwareScrollView 
            contentContainerStyle={newHostelStyles.scrollV} 
            ref={scrollRef} 
            enableOnAndroid={true}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
                <LineBreak />
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Title" />
                    <Input
                        hint="ex: Example Hostel"
                        value={title}
                        onChangeText={(e) => setTitle(e)}
                        onSubmitEditing={() => Keyboard.dismiss()}
                    />
                </View>

                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Categories" />
                    <Input
                        hint="ex: Example Hostel"
                        value="Hostels"
                        icon={images.arrowDown}
                        editable={false}
                    />
                </View>
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Add photos" />
                    <View style={newHostelStyles.hostelImgV}>
                        {
                            Array.from(hostelImages).map((item, idx) => <TouchableOpacity key={idx} style={newHostelStyles.addHostelV} onPress={() => {
                                getMedia("image", idx)
                            }}>
                                {item === null ? <Image source={images.plus} style={newHostelStyles.plusImg} /> : <Image source={{ uri: "media" in item ? item.media : images.plus }} style={newHostelStyles.hostelImg} />}
                            </TouchableOpacity>)
                        }
                    </View>
                    <View style={newHostelStyles.imgCaptionV}>
                        <Image source={images.alertCircle} style={newHostelStyles.alertCircle} />
                        <Text style={roboto.caption}>You can add up to 5 photos each not exceeding 3Mb</Text>
                    </View>
                </View>
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Add videos" />
                    <TouchableOpacity style={newHostelStyles.addHostelV} onPress={() => {
                        getMedia("video")
                    }}>
                        {hostelVideo === null ? <Image source={images.plus} style={newHostelStyles.plusImg} /> : <Image source={{ uri: "media" in hostelVideo ? hostelVideo.media : images.plus }} style={newHostelStyles.hostelImg} />}
                    </TouchableOpacity>
                </View>
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Address" />
                    <Input
                        hint="ex: 12, Gwani Street"
                        value={address}
                        onChangeText={(e) => setAddress(e)}
                        onSubmitEditing={() => Keyboard.dismiss()}
                    />
                </View>
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Hostel type" />
                    <TouchableOpacity onPress={() => {Keyboard.dismiss() ; setDrawer(true)}}>
                        <Input
                            hint="ex: Self con"
                            icon={images.arrowDown}
                            editable={false}
                            setSecureText={() => setDrawer(true)}
                            value={hostelType}
                        />
                    </TouchableOpacity>
                </View>
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Number of rooms available" />
                    <Input
                        hint="4"
                        keyboardType="numeric"
                        value={numberOfRooms}
                        onChangeText={(text) => setNumberOfRooms(text)}
                        ref={availableRoomsRef}
                        onFocus={() => focusNext(availableRoomsRef)}
                        returnKeyType="next"
                        onSubmitEditing={() => focusNext(totalRoomsRef)}
                    />
                </View>
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Total hostel rooms" />
                    <Input
                        hint="10"
                        keyboardType="numeric"
                        value={totalRooms}
                        onChangeText={(text) => setTotalRooms(text)}
                        ref={totalRoomsRef}
                        onFocus={() => focusNext(totalRoomsRef)}
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                    />
                </View>
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Roomate" />
                    <TouchableOpacity onPress={() => {Keyboard.dismiss() ; setRoomateDrawer(true)}}>
                        <Input
                            hint="yes/no"
                            icon={images.arrowDown}
                            editable={false}
                            value={roomate}
                            setSecureText={() => setRoomateDrawer(true)}
                        />
                    </TouchableOpacity>
                </View>
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Power supply" />
                    <TouchableOpacity onPress={() => {Keyboard.dismiss() ; setPowerDrawer(true)}}>
                        <Input
                            hint="yes/no"
                            icon={images.arrowDown}
                            editable={false}
                            value={power}
                            setSecureText={() => setPowerDrawer(true)}
                        />
                    </TouchableOpacity>
                </View>
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Kitchen Access" />
                    <TouchableOpacity onPress={() => {Keyboard.dismiss() ; setKitchenDrawer(true)}}>
                        <Input
                            hint="yes/no"
                            icon={images.arrowDown}
                            editable={false}
                            value={kitchen}
                            setSecureText={() => setKitchenDrawer(true)}
                        />
                    </TouchableOpacity>
                </View>
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Toilet Access" />
                    <TouchableOpacity onPress={() => {Keyboard.dismiss() ; setToiletDrawer(true)}}>
                        <Input
                            hint="yes/no"
                            icon={images.arrowDown}
                            editable={false}
                            value={toilet}
                            setSecureText={() => setToiletDrawer(true)}
                        />
                    </TouchableOpacity>
                </View>
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Landlord Resides" />
                    <TouchableOpacity onPress={() => {Keyboard.dismiss() ; setLandlordDrawer(true)}}>
                        <Input
                            hint="yes/no"
                            icon={images.arrowDown}
                            editable={false}
                            value={landlord}
                            setSecureText={() => setLandlordDrawer(true)}
                        />
                    </TouchableOpacity>
                </View>
                <View style={[newHostelStyles.inputV, newHostelStyles.paddingBottom]}>
                    <View style={newHostelStyles.descriptionV}>
                        <HostelLabel label="Description" />
                        <Text style={roboto.bodyMedium}>{descLength}/350</Text>
                    </View>
                    <Input
                        hint="Hostel description"
                        maxLength={350}
                        value={desc}
                        onChangeText={(text) => { setDesc(text); setDescLength(text.length.toString()) }}
                        ref={descriptionRef}
                        onFocus={() => focusNext(descriptionRef)}
                        returnKeyType="next"
                        onSubmitEditing={() => focusNext(yearlyRentRef)}
                        
                    />
                </View>
                <LineBreak />
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Rent Per Year" />
                    <Input
                        hint="eg. 150000"
                        keyboardType="numeric"
                        value={yearlyrent}
                        onChangeText={(text) => setYearlyRent(text)}
                        ref={yearlyRentRef}
                        onFocus={() => focusNext(yearlyRentRef)}
                        returnKeyType="next"
                        onSubmitEditing={() => focusNext(totalPriceRef)}
                    />
                </View>
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Total Price" />
                    <Input
                        hint="eg. 150000"
                        keyboardType="numeric"
                        value={totalPrice}
                        onChangeText={(text) => setTotalPrice(text)}
                        ref={totalPriceRef}
                        onFocus={() => focusNext(totalPriceRef)}
                        returnKeyType="next"
                        onSubmitEditing={() => focusNext(bulkPriceRef)}
                    />
                </View>
                <View style={[newHostelStyles.inputV, newHostelStyles.paddingBottom]}>
                    <Text style={roboto.bodyMediumBold}>Bulk price</Text>
                    <Input
                        hint="Add wholesale price?"
                        keyboardType="numeric"
                        value={bulkPrice}
                        onChangeText={(text) => setBulkPrice(text)}
                        ref={bulkPriceRef}
                        onFocus={() => focusNext(bulkPriceRef)}
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                    />
                </View>
                <LineBreak />
                <View style={newHostelStyles.padding}>
                    <Text style={[roboto.bodyLargeBold, newHostelStyles.paddingBottomSmall]}>You cannot post a Hostel Ad for free</Text>
                    <TouchableOpacity onPress={() => clickAdView("top")} style={[newHostelStyles.adView, newHostelStyles.topAdView, topAdView && newHostelStyles.selectedAdView]}>
                        <Text style={roboto.titleSmallBold}>Boost with gold</Text>
                        <Text style={[roboto.bodyMedium, colors.grays]}>Best choice if you need fast sale. Your ad will be at the top of search results and get 15X more traffic.</Text>
                        <View style={newHostelStyles.descriptionV}>
                            <View style={[newHostelStyles.descriptionV, newHostelStyles.gap]}>
                                <View style={newHostelStyles.adOption}>
                                    <Select text="7 days" selected={top7View} icon={top7View && images.whiteTick} adBox selectFun={() => clickAdView("7")} />
                                </View>
                                <View style={newHostelStyles.adOption}>
                                    <Select text="1 month" selected={top30View} icon={top30View && images.whiteTick} adBox selectFun={() => clickAdView("30")} />
                                </View>
                            </View>
                            <View>
                                <Text style={roboto.bodyLargeBold}>₦{adPrice}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => clickAdView("bottom")} style={[newHostelStyles.adView, newHostelStyles.bottomAdView, bottomAdView && newHostelStyles.selectedAdView]}>
                        <Text style={roboto.titleSmallBold}>Boost with Diamond</Text>
                        <View style={newHostelStyles.descriptionV}>
                            <Text style={roboto.titleSmall}>1 month</Text>
                            <Text style={roboto.bodyLargeBold}>₦19,999</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <LineBreak />

                <View style={{ padding: moderateScale(16), rowGap: verticalScale(8) }}>
                    <Select text="Post Ad" selected selectFun={() => onContinue()} />
                    <Select text="Add to drafts" selected={false} />
                    <Text style={[roboto.caption, colors.grays]}>By clicking on the post Ad, you accept the <Text style={[colors.foundationWarningDark, { textDecorationLine: "underline" }]} onPress={() => { WebBrowser.openBrowserAsync("https://google.com") }}>terms of use</Text>, confirm that you will abide by the safety tips, and declare that this Ad does not violate our <Text style={[colors.foundationWarningDark, { textDecorationLine: "underline" }]} onPress={() => { WebBrowser.openBrowserAsync("https://google.com") }}>safety policy.</Text></Text>
                </View>

            </KeyboardAwareScrollView>

            {
                drawer ? <Drawer title="Hostel Type" options={["Self Con", "Single Room", "One Room and Parlour", "Two Bedroom flat", "Room in a Flat", "3 Bedroom Flat"]} onCloseDrawer={setDrawer} onSelectOption={setHostelType} selectedOption={hostelType} /> : null
            }

            {
                roomateDrawer ? <Drawer title="Roomate" options={["yes", "no"]} onCloseDrawer={setRoomateDrawer} onSelectOption={setRoomate} selectedOption={roomate} /> : null
            }

            {
                powerDrawer ? <Drawer title="Power Supply" options={["yes", "no"]} onCloseDrawer={setPowerDrawer} onSelectOption={setPower} selectedOption={power} /> : null
            }

            {
                kitchenDrawer ? <Drawer title="Kitchen Access" options={["yes", "no"]} onCloseDrawer={setKitchenDrawer} onSelectOption={setKitchen} selectedOption={kitchen} /> : null
            }

            {
                toiletDrawer ? <Drawer title="Toilet Access" options={["yes", "no"]} onCloseDrawer={setToiletDrawer} onSelectOption={setToilet} selectedOption={toilet} /> : null
            }

            {
                landlordDrawer ? <Drawer title="Landlord Resides" options={["yes", "no"]} onCloseDrawer={setLandlordDrawer} onSelectOption={setLandlord} selectedOption={landlord} /> : null
            }
        </SafeAreaView>
    )
}
