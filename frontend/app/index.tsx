import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Redirect } from "expo-router";

import { colors } from "@/src/theme";
import { useAuth } from "@/src/context/AuthContext";
import { Txt } from "@/src/components/Txt";

export default function Index() {
  const { user, booting } = useAuth();

  if (booting) {
    return (
      <View style={styles.container} testID="boot-screen">
        <View style={styles.logo}>
          <Txt variant="display" color={colors.brandPrimary}>
            RYPPL
          </Txt>
        </View>
        <ActivityIndicator color={colors.brandPrimary} />
      </View>
    );
  }

  if (!user) return <Redirect href="/auth" />;
  if (user.role === "employee") return <Redirect href="/(employee)" />;
  return <Redirect href="/(customer)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  logo: { alignItems: "center" },
});
