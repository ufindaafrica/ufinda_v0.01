import { Tabs } from "expo-router";


export default function _Layout () {
    return (
        <Tabs>
            <Tabs.Screen 
                name="dashboard"
                options={{
                    title: "Dashboard"
                }}/>
                
            <Tabs.Screen 
                name="ads"
                options={{
                    title: "Ads"
                }}/>
        </Tabs>
    )
}
