import { images } from "@/constants/images";
import { fonts } from "@/styles/globals";
import { Tabs } from "expo-router";
import { Image, Text, View } from "react-native";


const TabIcon = ({ focused, activeImg, inactiveImg, iconTitle }: any) => {
    return (
        focused ? <View style={{
            backgroundColor: "#008000",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            width: "280%",
            borderRadius: 25,
            height: "150%"
        }}>
            <Image source={activeImg} style={{
                width: 27,
                height: 27,
                marginRight: 3
            }} />
            <Text style={{
                fontFamily: fonts.regular,
                color: "#fffff7",
            }}>{iconTitle}</Text>
        </View>
            :
            <View style={{
                alignItems: "center"
            }}>
                <Image source={inactiveImg} style={{
                    height: 27,
                    width: 27
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
                    height: 60,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 16,
                },
                tabBarItemStyle: {
                    width: "100%",
                    height: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                    paddingVertical: 10
                }
            }}>
            <Tabs.Screen
                name="home"
                options={{
                    title: "Home",
                    tabBarIcon: ({ focused }) =>
                        <TabIcon
                            focused={focused}
                            activeImg={images.activeHome}
                            inactiveImg={images.inactiveHome}
                            iconTitle={"Home"} />
                }}
            />

            <Tabs.Screen
                name="saved"
                options={{
                    title: "Saved",
                    tabBarIcon: ({ focused }) =>
                        <TabIcon
                            focused={focused}
                            activeImg={images.activeSaved}
                            inactiveImg={images.inactiveSaved}
                            iconTitle={"Saved"} />
                }}
            />

            <Tabs.Screen
                name="add"
                options={{
                    title: "Add",
                    tabBarIcon: ({ focused }) =>
                        <TabIcon
                            focused={focused}
                            activeImg={images.activeAdd}
                            inactiveImg={images.inactiveAdd}
                            iconTitle={"Add"} />
                }}
            />

            <Tabs.Screen
                name="chat"
                options={{
                    title: "Chat",
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
                    title: "Profile",
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

