import React, { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/api/client";
import { colors, radius, shadow, spacing, STATUS_META } from "@/src/theme";
import { money } from "@/src/lib/format";
import { Txt } from "@/src/components/Txt";
import { Header } from "@/src/components/Header";
import { StatusBadge } from "@/src/components/StatusBadge";
import { OrderTimeline } from "@/src/components/OrderTimeline";
import { CampusMap, MapPin } from "@/src/components/CampusMap";
import { LoadingState, ErrorState } from "@/src/components/States";

type Order = {
  id: string;
  order_number: string;
  items: { name: string; qty: number; price: number; image_url: string }[];
  subtotal: number;
  discount: number;
  delivery_fee: number;
  tip: number;
  total: number;
  status: string;
  address: { building: string; room: string; x: number; y: number };
  runner_name?: string | null;
  points_earned: number;
  payment_method: string;
};

export default function OrderTracking() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const o = await api<Order>(`/orders/${id}`);
      setOrder(o);
      setError(false);
      if (o.status === "complete" && timer.current) {
        clearInterval(timer.current);
      }
    } catch {
      setError(true);
    }
  }, [id]);

  useEffect(() => {
    load();
    timer.current = setInterval(load, 5000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [load]);

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
  const pin: MapPin = {
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    pin: order.status === "complete" ? "green" : "blue",
    address: order.address,
    item_count: order.items.length,
    total: order.total,
  };

  return (
    <View style={styles.container}>
      <Header title={order.order_number} subtitle="Live tracking" showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl }}
      >
        {/* Status hero */}
        <View style={[styles.statusHero, { backgroundColor: meta.color + "18" }]}>
          <View style={[styles.statusIcon, { backgroundColor: meta.color }]}>
            <Ionicons
              name={order.status === "complete" ? "checkmark-done" : "bicycle"}
              size={26}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.flex}>
            <Txt variant="heading">{meta.label}</Txt>
            <Txt variant="caption">
              {order.status === "complete"
                ? "Delivered to your door"
                : "We'll update you at every step"}
            </Txt>
          </View>
        </View>

        {/* Map snippet */}
        <View style={styles.mapCard}>
          <CampusMap pins={[pin]} onPressPin={() => {}} />
        </View>
        <View style={styles.addrRow}>
          <Ionicons name="location" size={16} color={colors.brand} />
          <Txt variant="label" style={styles.addrTxt}>
            {order.address.building} · Room {order.address.room}
          </Txt>
        </View>

        {/* Timeline */}
        <View style={styles.card}>
          <Txt variant="subtitle" style={styles.cardTitle}>
            Delivery progress
          </Txt>
          <OrderTimeline currentStatus={order.status} />
        </View>

        {/* Items */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Txt variant="subtitle">Order items</Txt>
            <StatusBadge status={order.status} />
          </View>
          {order.items.map((it, i) => (
            <View key={i} style={styles.itemRow}>
              <Image source={{ uri: it.image_url }} style={styles.itemImg} contentFit="cover" />
              <View style={styles.flex}>
                <Txt variant="body" numberOfLines={1}>
                  {it.name}
                </Txt>
                <Txt variant="caption">Qty {it.qty}</Txt>
              </View>
              <Txt variant="subtitle">{money(it.price * it.qty)}</Txt>
            </View>
          ))}

          <View style={styles.divider} />
          <Row label="Subtotal" value={money(order.subtotal)} />
          {order.discount > 0 ? <Row label="Discount" value={`−${money(order.discount)}`} /> : null}
          <Row label="Delivery" value={money(order.delivery_fee)} />
          <Row label="Tip" value={money(order.tip)} />
          <View style={styles.divider} />
          <Row label="Total" value={money(order.total)} bold />
        </View>

        {/* Points */}
        <View style={styles.pointsRow}>
          <Ionicons name="star" size={18} color={colors.brand} />
          <Txt variant="label" color={colors.brand} style={styles.pointsTxt}>
            You earned {order.points_earned} RYPPL points on this order
          </Txt>
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.sumRow}>
      <Txt variant={bold ? "subtitle" : "body"} color={bold ? colors.onSurface : colors.muted}>
        {label}
      </Txt>
      <Txt variant={bold ? "heading" : "subtitle"} color={bold ? colors.brand : colors.onSurface}>
        {value}
      </Txt>
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
  statusIcon: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  mapCard: {
    height: 200,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginTop: spacing.lg,
    ...shadow.card,
  },
  addrRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.md, gap: 6 },
  addrTxt: {},
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadow.soft,
  },
  cardTitle: { marginBottom: spacing.md },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  itemRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  itemImg: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.surfaceTertiary },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.sm },
  sumRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  pointsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.md,
    gap: 6,
  },
  pointsTxt: {},
});
