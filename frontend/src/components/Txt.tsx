import React from "react";
import { Text, TextProps, StyleSheet, TextStyle } from "react-native";

import { colors, font, fontSize } from "@/src/theme";

type Variant =
  | "display"
  | "title"
  | "heading"
  | "subtitle"
  | "body"
  | "bodyMuted"
  | "label"
  | "caption";

const variantStyle: Record<Variant, TextStyle> = {
  display: { fontFamily: font.extrabold, fontSize: fontSize.xxxl, color: colors.onSurface },
  title: { fontFamily: font.extrabold, fontSize: fontSize.xxl, color: colors.onSurface },
  heading: { fontFamily: font.bold, fontSize: fontSize.xl, color: colors.onSurface },
  subtitle: { fontFamily: font.semibold, fontSize: fontSize.lg, color: colors.onSurface },
  body: { fontFamily: font.regular, fontSize: fontSize.base, color: colors.onSurface },
  bodyMuted: { fontFamily: font.regular, fontSize: fontSize.base, color: colors.muted },
  label: { fontFamily: font.semibold, fontSize: fontSize.sm, color: colors.onSurfaceSecondary },
  caption: { fontFamily: font.medium, fontSize: fontSize.xs, color: colors.muted },
};

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
  center?: boolean;
  children: React.ReactNode;
}

export function Txt({ variant = "body", color, center, style, children, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[
        variantStyle[variant],
        color ? { color } : null,
        center ? styles.center : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({ center: { textAlign: "center" } });
