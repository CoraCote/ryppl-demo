import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

import { colors, font, fontSize, radius, spacing } from "@/src/theme";
import { Txt } from "./Txt";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  size?: "md" | "lg";
  style?: ViewStyle;
  testID?: string;
}

const bg: Record<Variant, string> = {
  primary: colors.brandPrimary,
  secondary: colors.brand,
  outline: "transparent",
  ghost: "transparent",
  danger: colors.error,
  success: colors.success,
};

const fg: Record<Variant, string> = {
  primary: colors.onBrandPrimary,
  secondary: colors.onBrandSecondary,
  outline: colors.brand,
  ghost: colors.brand,
  danger: colors.onError,
  success: colors.onSuccess,
};

export function Button({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  icon,
  fullWidth = true,
  size = "lg",
  style,
  testID,
}: Props) {
  const isDisabled = disabled || loading;
  const handle = () => {
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  };

  return (
    <Pressable
      testID={testID}
      onPress={handle}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        size === "lg" ? styles.lg : styles.md,
        { backgroundColor: bg[variant] },
        variant === "outline" && styles.outline,
        fullWidth && styles.full,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg[variant]} />
      ) : (
        <View style={styles.row}>
          {icon ? (
            <Ionicons name={icon} size={18} color={fg[variant]} style={styles.icon} />
          ) : null}
          <Txt style={{ fontFamily: font.bold, fontSize: fontSize.lg, color: fg[variant] }}>
            {title}
          </Txt>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  md: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
  full: { alignSelf: "stretch" },
  outline: { borderWidth: 2, borderColor: colors.borderStrong },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
  row: { flexDirection: "row", alignItems: "center" },
  icon: { marginRight: spacing.sm },
});
