import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/src/context/AuthContext";
import { colors, radius, shadow, spacing } from "@/src/theme";
import { initials } from "@/src/lib/format";
import { Txt } from "@/src/components/Txt";
import { Button } from "@/src/components/Button";

export default function EmployeeProfile() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const isRunner = user?.sub_role === "runner";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 68 + insets.bottom + spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={[colors.brand, "#0d2d54"]} style={[styles.header, { paddingTop: insets.top + spacing.xl }]}>
        <View style={styles.avatar}>
          <Txt variant="title" color={colors.brand}>
            {initials(user?.name || "R").toUpperCase()}
          </Txt>
        </View>
        <Txt variant="heading" color="#FFFFFF">
          {user?.name}
        </Txt>
        <View style={styles.roleBadge}>
          <Ionicons name={isRunner ? "bicycle" : "cube"} size={14} color={colors.brand} />
          <Txt variant="label" color={colors.brand} style={styles.roleTxt}>
            {isRunner ? "Runner" : "Packer"}
          </Txt>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-done" size={22} color={colors.success} />
            <Txt variant="title" style={styles.statNum}>
              —
            </Txt>
            <Txt variant="caption">Completed</Txt>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={22} color={colors.warning} />
            <Txt variant="title" style={styles.statNum}>
              ~7m
            </Txt>
            <Txt variant="caption">Avg time</Txt>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star" size={22} color={colors.brandPrimary} />
            <Txt variant="title" style={styles.statNum}>
              5.0
            </Txt>
            <Txt variant="caption">Rating</Txt>
          </View>
        </View>

        <View style={styles.card}>
          <Row icon="call-outline" label="Phone" value={user?.phone || ""} />
          <View style={styles.divider} />
          <Row icon="briefcase-outline" label="Role" value={isRunner ? "Delivery Runner" : "Order Packer"} />
          <View style={styles.divider} />
          <Row icon="shield-checkmark-outline" label="Status" value="Active" valueColor={colors.success} />
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={18} color={colors.brand} />
          <Txt variant="caption" color={colors.onBrandTertiary} style={styles.tipTxt}>
            {isRunner
              ? "Claim red pins on the map, then send an SMS when you arrive to complete faster."
              : "Claim incoming orders quickly, pack accurately, and mark ready for runners."}
          </Txt>
        </View>

        <Button title="Sign Out" variant="outline" icon="log-out-outline" onPress={logout} testID="logout-button" />
      </View>
    </ScrollView>
  );
}

function Row({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.brand} />
      </View>
      <Txt variant="body" style={styles.rowLabel}>
        {label}
      </Txt>
      <Txt variant="label" color={valueColor}>
        {value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  header: { alignItems: "center", paddingBottom: spacing.xxl + spacing.lg, paddingHorizontal: spacing.xl },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
    gap: 4,
  },
  roleTxt: {},
  body: { paddingHorizontal: spacing.lg, marginTop: -spacing.xxl },
  statsRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
    gap: 4,
    ...shadow.soft,
  },
  statNum: {},
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadow.soft },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  rowLabel: { flex: 1 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 2 },
  tipCard: {
    flexDirection: "row",
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tipTxt: { flex: 1, lineHeight: 18 },
});
