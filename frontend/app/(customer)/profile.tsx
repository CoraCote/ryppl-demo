import React, { useState } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Switch, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/src/context/AuthContext";
import { colors, radius, shadow, spacing } from "@/src/theme";
import { initials } from "@/src/lib/format";
import { Txt } from "@/src/components/Txt";
import { Button } from "@/src/components/Button";

function MenuRow({
  icon,
  label,
  value,
  onPress,
  right,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress} testID={`menu-${label}`}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={20} color={colors.brand} />
      </View>
      <Txt variant="body" style={styles.menuLabel}>
        {label}
      </Txt>
      {value ? <Txt variant="label">{value}</Txt> : null}
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null)}
    </Pressable>
  );
}

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [notify, setNotify] = useState(true);

  const shareReferral = async () => {
    await Share.share({
      message: `Join me on RYPPL for campus snack delivery! Use my code ${user?.referral_code} for a discount on your first order. 🎉`,
    });
  };

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
          {user?.name || "Student"}
        </Txt>
        <Txt variant="body" color="#CBD5E1">
          {user?.phone}
        </Txt>
      </LinearGradient>

      <View style={styles.body}>
        {/* Points */}
        <View style={styles.pointsCard}>
          <View style={styles.flex}>
            <Txt variant="caption" color={colors.brand}>
              RYPPL POINTS
            </Txt>
            <Txt variant="display" color={colors.brand} style={styles.pointsNum}>
              {user?.points ?? 0}
            </Txt>
            <Txt variant="caption" color={colors.onBrandTertiary}>
              Earn 1 point per $1 spent
            </Txt>
          </View>
          <View style={styles.pointsIcon}>
            <Ionicons name="star" size={30} color={colors.brand} />
          </View>
        </View>

        {/* Referral */}
        <View style={styles.card}>
          <View style={styles.referTop}>
            <Ionicons name="gift" size={20} color={colors.brand} />
            <Txt variant="subtitle" style={styles.referTitle}>
              Invite friends
            </Txt>
          </View>
          <Txt variant="bodyMuted" style={styles.referSub}>
            Share your code — they get a discount, you earn points.
          </Txt>
          <View style={styles.codeBox}>
            <Txt variant="heading" color={colors.brand} style={styles.code}>
              {user?.referral_code || "—"}
            </Txt>
            <Pressable style={styles.shareBtn} onPress={shareReferral} testID="share-referral">
              <Ionicons name="share-social" size={16} color={colors.onBrandPrimary} />
              <Txt variant="label" color={colors.onBrandPrimary} style={styles.shareTxt}>
                Share
              </Txt>
            </Pressable>
          </View>
        </View>

        {/* Account */}
        <Txt variant="label" style={styles.sectionLabel}>
          ACCOUNT
        </Txt>
        <View style={styles.card}>
          <MenuRow icon="receipt-outline" label="Order History" value={`${user?.orders_count ?? 0}`} onPress={() => router.push("/(customer)/orders")} />
          <View style={styles.divider} />
          <MenuRow icon="card-outline" label="Payment Methods" value="Visa •••• 4242" onPress={() => {}} />
          <View style={styles.divider} />
          <MenuRow
            icon="notifications-outline"
            label="Notifications"
            right={
              <Switch
                value={notify}
                onValueChange={setNotify}
                trackColor={{ true: colors.brandPrimary, false: colors.border }}
                thumbColor="#FFFFFF"
                testID="notify-switch"
              />
            }
          />
        </View>

        <Txt variant="label" style={styles.sectionLabel}>
          SUPPORT
        </Txt>
        <View style={styles.card}>
          <MenuRow icon="help-circle-outline" label="Help & FAQ" onPress={() => {}} />
          <View style={styles.divider} />
          <MenuRow icon="shield-checkmark-outline" label="Privacy & Terms" onPress={() => {}} />
        </View>

        <View style={styles.logout}>
          <Button title="Sign Out" variant="outline" icon="log-out-outline" onPress={logout} testID="logout-button" />
        </View>
        <Txt variant="caption" center style={styles.version}>
          RYPPL v1.0.0
        </Txt>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  flex: { flex: 1 },
  header: {
    alignItems: "center",
    paddingBottom: spacing.xxl + spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  body: { paddingHorizontal: spacing.lg, marginTop: -spacing.xxl },
  pointsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  pointsNum: { marginVertical: 2 },
  pointsIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(10,35,66,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.soft,
  },
  referTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  referTitle: {},
  referSub: { marginTop: 4 },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.brand,
    padding: spacing.md,
  },
  code: { flex: 1, letterSpacing: 2 },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    gap: 4,
  },
  shareTxt: {},
  sectionLabel: { marginBottom: spacing.sm, marginLeft: spacing.xs },
  menuRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  menuLabel: { flex: 1 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 2 },
  logout: { marginTop: spacing.xs },
  version: { marginTop: spacing.lg },
});
