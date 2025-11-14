import { images } from "@/constants/images";
import { Tabs } from "expo-router";
import { Image, View } from "react-native";


const TabIcon = ({ focused, activeImg, inactiveImg, iconTitle }: any) => {
    return (
        <View style={[{
            width: 55,
            borderRadius: 37,
            height: 55,
            justifyContent: "center",
            alignItems: "center"
        }, focused && {
            backgroundColor: "#008000",
        }]}>
            <Image source={focused ? activeImg : inactiveImg} style={{
                width: 30,
                height: 30
            }} />
        </View>
    )
}

export default function _Layout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    height: 64,
                    width: 274,
                    borderRadius: 36,
                    marginBottom: 16,
                    elevation: 1,
                    padding: 0,
                    marginLeft: 16
                },
                tabBarItemStyle: {
                    alignItems: "center",
                    paddingTop: 12.5
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

