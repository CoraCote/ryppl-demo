import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors, font, shadow } from "@/src/theme";
import { useCart } from "@/src/context/CartContext";
import { Txt } from "@/src/components/Txt";

function TabIcon({
  name,
  focused,
  badge,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  badge?: number;
}) {
  return (
    <View style={styles.iconWrap}>
      <View style={[styles.iconPill, focused && styles.iconPillActive]}>
        <Ionicons name={name} size={22} color={focused ? colors.brand : colors.muted} />
      </View>
      {badge ? (
        <View style={styles.badge}>
          <Txt variant="caption" color={colors.onBrandPrimary} style={styles.badgeTxt}>
            {badge}
          </Txt>
        </View>
      ) : null}
    </View>
  );
}

export default function CustomerLayout() {
  const { count } = useCart();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: { paddingTop: 6 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? "home" : "home-outline"} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? "search" : "search-outline"} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? "receipt" : "receipt-outline"} focused={focused} badge={count} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? "person" : "person-outline"} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    height: Platform.OS === "ios" ? 88 : 68,
    paddingTop: 6,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.floating,
  },
  tabLabel: { fontFamily: font.semibold, fontSize: 11, marginTop: 2 },
  iconWrap: { alignItems: "center", justifyContent: "center" },
  iconPill: {
    width: 46,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPillActive: { backgroundColor: colors.brandTertiary },
  badge: {
    position: "absolute",
    top: -4,
    right: 6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeTxt: { fontFamily: font.bold, fontSize: 10 },
});
