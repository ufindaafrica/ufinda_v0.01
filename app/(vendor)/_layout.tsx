import { images } from "@/constants/images";
import { moderateScale, scale, verticalScale } from "@/deps/scale";
import { Tabs } from "expo-router";
import { Image, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";


const TabIcon = ({ focused, activeImg, inactiveImg, iconTitle }: any) => {
    return (
        <View style={[{
            width: scale(55),
            borderRadius: 37,
            height: scale(55),
            justifyContent: "center",
            alignItems: "center"
        }, focused && {
            backgroundColor: "#008000",
        }]}>
            <Image source={focused ? activeImg : inactiveImg} style={{
                width: scale(30),
                height: scale(30)
            }} />
        </View>
    )
}

export default function _Layout() {
    const insets = useSafeAreaInsets()

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    height: verticalScale(64),
                    width: scale(274),
                    borderRadius: moderateScale(36),
                    elevation: 1,
                    position: "absolute",
                    bottom: moderateScale(16) + insets.bottom,
                    marginLeft: moderateScale(16)
                },
                tabBarItemStyle: {
                    alignItems: "center",
                    paddingTop: moderateScale(13.5)
                }
            }}>
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: "Dashboard",
                    tabBarIcon: ({ focused }) =>
                        <TabIcon
                            focused={focused}
                            activeImg={images.activeDashboard}
                            inactiveImg={images.dashboard}
                            iconTitle={"Home"} />
                }}
            />

            <Tabs.Screen
                name="ads"
                options={{
                    title: "Ads",
                    tabBarIcon: ({ focused }) =>
                        <TabIcon
                            focused={focused}
                            activeImg={images.activeAds}
                            inactiveImg={images.ads}
                            iconTitle={"Saved"} />
                }}
            />

            <Tabs.Screen
                name="chat"
                options={{
                    title: "Vendor Chat",
                    tabBarIcon: ({ focused }) =>
                        <TabIcon
                            focused={focused}
                            activeImg={images.activeChat}
                            inactiveImg={images.inactiveChat}
                            iconTitle={"Chat"} />
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: "Vendor Profile",
                    tabBarIcon: ({ focused }) =>
                        <TabIcon
                            focused={focused}
                            activeImg={images.activeUser}
                            inactiveImg={images.inactiveUser}
                            iconTitle={"User"} />
                }}
            />
        </Tabs>
    )
}

