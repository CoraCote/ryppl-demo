import React, { useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

import { colors, font, radius, shadow, spacing } from "@/src/theme";
import { Txt } from "./Txt";

export type MapPin = {
  id: string;
  order_number: string;
  status: string;
  pin: "green" | "red" | "blue" | "gray";
  address: { building: string; room: string; x: number; y: number };
  item_count: number;
  total: number;
};

const PIN_COLORS: Record<string, string> = {
  green: colors.pinGreen,
  red: colors.pinRed,
  blue: colors.pinBlue,
  gray: colors.pinGray,
};

// Decorative campus buildings (static backdrop).
const BUILDINGS = [
  { x: 0.08, y: 0.1, w: 0.24, h: 0.18, label: "Library" },
  { x: 0.62, y: 0.08, w: 0.3, h: 0.16, label: "West Quad" },
  { x: 0.7, y: 0.55, w: 0.24, h: 0.22, label: "Bursley" },
  { x: 0.06, y: 0.62, w: 0.26, h: 0.2, label: "Markley" },
  { x: 0.38, y: 0.72, w: 0.24, h: 0.18, label: "East Quad" },
];

interface Props {
  pins: MapPin[];
  onPressPin: (pin: MapPin) => void;
}

export function CampusMap({ pins, onPressPin }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="grass" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#E8F3EC" />
            <Stop offset="1" stopColor="#DDEBF7" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grass)" />

        {/* Roads */}
        <Line x1="0" y1="50%" x2="100%" y2="50%" stroke="#CBD5E1" strokeWidth={18} strokeLinecap="round" />
        <Line x1="50%" y1="0" x2="50%" y2="100%" stroke="#CBD5E1" strokeWidth={18} strokeLinecap="round" />
        <Line x1="0" y1="50%" x2="100%" y2="50%" stroke="#F8FAFC" strokeWidth={2} strokeDasharray="8 10" />
        <Line x1="50%" y1="0" x2="50%" y2="100%" stroke="#F8FAFC" strokeWidth={2} strokeDasharray="8 10" />

        {/* Central quad */}
        <Circle cx="50%" cy="50%" r={size.w * 0.11} fill="#CFE8D6" />
        <Path
          d={`M ${size.w * 0.5} ${size.h * 0.5 - size.w * 0.05} l ${size.w * 0.04} ${size.w * 0.08} l ${-size.w * 0.08} 0 z`}
          fill="#8CC69C"
        />

        {/* Buildings */}
        {size.w > 0 &&
          BUILDINGS.map((b, i) => (
            <React.Fragment key={i}>
              <Rect
                x={b.x * size.w}
                y={b.y * size.h}
                width={b.w * size.w}
                height={b.h * size.h}
                rx={10}
                fill="#FFFFFF"
                stroke="#E2E8F0"
                strokeWidth={1.5}
              />
              <SvgText
                x={(b.x + b.w / 2) * size.w}
                y={(b.y + b.h / 2) * size.h + 4}
                fontSize={11}
                fontFamily={font.semibold}
                fill="#64748B"
                textAnchor="middle"
              >
                {b.label}
              </SvgText>
            </React.Fragment>
          ))}
      </Svg>

      {/* Interactive pins */}
      {size.w > 0 &&
        pins.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => onPressPin(p)}
            style={[
              styles.pin,
              {
                left: p.address.x * size.w - 18,
                top: p.address.y * size.h - 40,
              },
            ]}
            testID={`map-pin-${p.id}`}
          >
            <View style={[styles.pinHead, { backgroundColor: PIN_COLORS[p.pin] }]}>
              <Ionicons name="fast-food" size={16} color="#FFFFFF" />
            </View>
            <View style={[styles.pinTail, { borderTopColor: PIN_COLORS[p.pin] }]} />
          </Pressable>
        ))}

      {/* Legend */}
      <View style={styles.legend}>
        <LegendDot color={colors.pinGreen} label="Unpacked" />
        <LegendDot color={colors.pinRed} label="Packed" />
        <LegendDot color={colors.pinBlue} label="Yours" />
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Txt variant="caption" color={colors.onSurfaceSecondary}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: "hidden", backgroundColor: "#E8F3EC" },
  pin: { position: "absolute", alignItems: "center" },
  pinHead: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    ...shadow.floating,
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -2,
  },
  legend: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 6,
    ...shadow.soft,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
});
