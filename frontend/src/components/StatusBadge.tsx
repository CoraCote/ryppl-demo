import React from "react";
import { StyleSheet, View } from "react-native";

import { colors, radius, spacing, STATUS_META } from "@/src/theme";
import { Txt } from "./Txt";

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, color: colors.muted };
  return (
    <View style={[styles.badge, { backgroundColor: meta.color + "22" }]} testID={`status-${status}`}>
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
      <Txt variant="caption" color={meta.color} style={styles.txt}>
        {meta.label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  txt: { fontFamily: "PlusJakartaSans-Bold" },
});
