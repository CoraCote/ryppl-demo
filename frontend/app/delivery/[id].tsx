import React, { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";
import { colors, radius, shadow, spacing, STATUS_META } from "@/src/theme";
import { money } from "@/src/lib/format";
import { Txt } from "@/src/components/Txt";
import { Button } from "@/src/components/Button";
import { Header } from "@/src/components/Header";
import { StatusBadge } from "@/src/components/StatusBadge";
import { LoadingState, ErrorState } from "@/src/components/States";

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  items: { name: string; qty: number; price: number; image_url: string }[];
  total: number;
  status: string;
  address: { building: string; room: string };
  packer_id?: string | null;
  runner_id?: string | null;
};

export default function Delivery() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [sms, setSms] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(false);
    try {
      const o = await api<Order>(`/orders/${id}`);
      setOrder(o);
    } catch {
      setError(true);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const advance = async () => {
    setBusy(true);
    try {
      await api(`/orders/${id}/advance`, { method: "POST" });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      await load();
    } catch {
    } finally {
      setBusy(false);
    }
  };

  const sendSms = async () => {
    setBusy(true);
    try {
      const res = await api<{ message: string }>(`/orders/${id}/sms-confirm`, { method: "POST" });
      setSms(res.message);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {
    } finally {
      setBusy(false);
    }
  };

  const openMaps = () => {
    if (!order) return;
    const q = encodeURIComponent(`${order.address.building} Room ${order.address.room}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`).catch(() => {});
  };

  const completeOrder = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await advance();
  };

  if (error && !order) {
    return (
      <View style={styles.container}>
        <Header title="Order" showBack />
        <ErrorState message="Couldn't load order" onRetry={load} />
      </View>
    );
  }
  if (!order) {
    return (
      <View style={styles.container}>
        <Header title="Order" showBack />
        <LoadingState />
      </View>
    );
  }

  const meta = STATUS_META[order.status];
  const isPacker = user?.sub_role === "packer";
  const isRunner = user?.sub_role === "runner";
  const minePacker = order.packer_id === user?.id;
  const mineRunner = order.runner_id === user?.id;

  const allChecked = order.items.every((_, i) => checked[i]);
  const isRunnerFlow = ["claimed_runner", "in_bag", "on_road", "complete"].includes(order.status);

  const renderActions = () => {
    if (order.status === "complete") {
      return (
        <View style={styles.doneCard}>
          <Ionicons name="checkmark-done-circle" size={30} color={colors.success} />
          <Txt variant="subtitle" color={colors.success}>
            Delivered! Great work.
          </Txt>
        </View>
      );
    }

    // Packer actions
    if (isPacker && minePacker) {
      if (order.status === "claimed_packer") {
        return <Button title="Start Packing" icon="cube" loading={busy} onPress={advance} testID="start-packing" />;
      }
      if (order.status === "packing") {
        return (
          <Button
            title={allChecked ? "Mark Ready for Pickup" : "Check all items to continue"}
            icon="checkmark-done"
            disabled={!allChecked}
            loading={busy}
            onPress={advance}
            testID="mark-ready"
          />
        );
      }
    }

    // Runner actions
    if (isRunner && mineRunner) {
      if (order.status === "claimed_runner") {
        return <Button title="Confirm Pickup (In Bag)" icon="bag-check" loading={busy} onPress={advance} testID="confirm-pickup" />;
      }
      if (order.status === "in_bag") {
        return (
          <View style={styles.stack}>
            <Button title="Open in Google Maps" variant="outline" icon="navigate" onPress={openMaps} testID="open-maps" />
            <Button title="Start Delivery (On the Road)" icon="bicycle" loading={busy} onPress={advance} testID="start-delivery" />
          </View>
        );
      }
      if (order.status === "on_road") {
        return (
          <View style={styles.stack}>
            <Button title="Open in Google Maps" variant="outline" icon="navigate" onPress={openMaps} testID="open-maps" />
            <Button title="Send SMS Confirmation" variant="secondary" icon="chatbubble-ellipses" loading={busy} onPress={sendSms} testID="send-sms" />
            <Pressable
              style={styles.holdBtn}
              onLongPress={completeOrder}
              delayLongPress={600}
              testID="mark-complete"
            >
              <Ionicons name="checkmark-done-circle" size={22} color={colors.onSuccess} />
              <Txt variant="subtitle" color={colors.onSuccess} style={styles.holdTxt}>
                Press & hold to complete
              </Txt>
            </Pressable>
          </View>
        );
      }
    }

    return (
      <View style={styles.waitCard}>
        <Ionicons name="hourglass-outline" size={20} color={colors.muted} />
        <Txt variant="label" style={styles.waitTxt}>
          {isRunnerFlow ? "Waiting on runner action" : "Waiting on packer action"}
        </Txt>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title={order.order_number} subtitle={isRunnerFlow ? "Delivery" : "Packing"} showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl }}
      >
        {/* Status */}
        <View style={[styles.statusHero, { backgroundColor: meta.color + "18" }]}>
          <View style={[styles.statusIcon, { backgroundColor: meta.color }]}>
            <Ionicons name={isRunnerFlow ? "bicycle" : "cube"} size={24} color="#FFFFFF" />
          </View>
          <View style={styles.flex}>
            <Txt variant="heading">{meta.label}</Txt>
            <StatusBadge status={order.status} />
          </View>
        </View>

        {/* Customer / address */}
        <View style={styles.card}>
          <Row icon="person-outline" label="Customer" value={order.customer_name} />
          <View style={styles.divider} />
          <Row icon="location-outline" label="Deliver to" value={`${order.address.building}, ${order.address.room}`} />
          <View style={styles.divider} />
          <Row icon="cash-outline" label="Order total" value={money(order.total)} />
        </View>

        {/* SMS preview */}
        {sms ? (
          <View style={styles.smsCard}>
            <Txt variant="label" style={styles.smsLabel}>
              MESSAGE SENT TO {order.customer_name.toUpperCase()}
            </Txt>
            <View style={styles.bubble}>
              <Txt variant="body" color="#FFFFFF">
                {sms}
              </Txt>
            </View>
          </View>
        ) : null}

        {/* Items / packing checklist */}
        <View style={styles.card}>
          <Txt variant="subtitle" style={styles.cardTitle}>
            {order.status === "packing" && isPacker ? "Pack these items" : "Items"}
          </Txt>
          {order.items.map((it, i) => {
            const packing = order.status === "packing" && isPacker && minePacker;
            return (
              <Pressable
                key={i}
                disabled={!packing}
                onPress={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                style={styles.itemRow}
                testID={`pack-item-${i}`}
              >
                <Image source={{ uri: it.image_url }} style={styles.itemImg} contentFit="cover" />
                <View style={styles.flex}>
                  <Txt variant="body" numberOfLines={1}>
                    {it.name}
                  </Txt>
                  <Txt variant="caption">Qty {it.qty}</Txt>
                </View>
                {packing ? (
                  <Ionicons
                    name={checked[i] ? "checkbox" : "square-outline"}
                    size={24}
                    color={checked[i] ? colors.success : colors.borderStrong}
                  />
                ) : (
                  <Txt variant="subtitle">×{it.qty}</Txt>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.actions}>{renderActions()}</View>
      </ScrollView>
    </View>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.brand} />
      </View>
      <Txt variant="body" style={styles.flex}>
        {label}
      </Txt>
      <Txt variant="subtitle">{value}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  flex: { flex: 1 },
  statusHero: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  statusIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.lg, ...shadow.soft },
  cardTitle: { marginBottom: spacing.md },
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
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 2 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  itemImg: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.surfaceTertiary },
  smsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadow.soft,
  },
  smsLabel: { marginBottom: spacing.sm },
  bubble: {
    backgroundColor: colors.info,
    borderRadius: radius.lg,
    borderBottomRightRadius: 4,
    padding: spacing.md,
    alignSelf: "flex-end",
    maxWidth: "90%",
  },
  actions: { marginTop: spacing.xl },
  stack: { gap: spacing.md },
  holdBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.success,
    borderRadius: radius.pill,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  holdTxt: {},
  doneCard: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadow.soft,
  },
  waitCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
  },
  waitTxt: {},
});
