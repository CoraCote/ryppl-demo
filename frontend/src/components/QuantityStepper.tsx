import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius } from "@/src/theme";
import { Txt } from "./Txt";

interface Props {
  value: number;
  onChange: (v: number) => void;
  size?: "sm" | "md";
  min?: number;
  testID?: string;
}

export function QuantityStepper({ value, onChange, size = "md", min = 0, testID }: Props) {
  const dim = size === "sm" ? 30 : 38;
  const tap = (delta: number) => {
    Haptics.selectionAsync().catch(() => {});
    onChange(Math.max(min, value + delta));
  };

  return (
    <View style={styles.wrap} testID={testID}>
      <Pressable
        onPress={() => tap(-1)}
        style={[styles.btn, { width: dim, height: dim }]}
        testID={testID ? `${testID}-decrement` : undefined}
      >
        <Ionicons name="remove" size={size === "sm" ? 16 : 20} color={colors.brand} />
      </Pressable>
      <Txt variant="subtitle" style={styles.value}>
        {value}
      </Txt>
      <Pressable
        onPress={() => tap(1)}
        style={[styles.btn, styles.btnAccent, { width: dim, height: dim }]}
        testID={testID ? `${testID}-increment` : undefined}
      >
        <Ionicons name="add" size={size === "sm" ? 16 : 20} color={colors.brand} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center" },
  btn: {
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
  },
  btnAccent: { backgroundColor: colors.brandPrimary },
  value: { minWidth: 32, textAlign: "center" },
});
