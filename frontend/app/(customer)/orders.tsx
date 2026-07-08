import React, { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/api/client";
import { colors, radius, shadow, spacing } from "@/src/theme";
import { money, timeAgo } from "@/src/lib/format";
import { Txt } from "@/src/components/Txt";
import { StatusBadge } from "@/src/components/StatusBadge";
import { LoadingState, ErrorState, EmptyState } from "@/src/components/States";

type Order = {
  id: string;
  order_number: string;
  items: { name: string; qty: number; image_url: string }[];
  total: number;
  status: string;
  created_at: string;
  address: { building: string; room: string };
};

export default function Orders() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const data = await api<Order[]>("/orders");
      setOrders(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View style={styles.container}>
      <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]}>
        <Txt variant="title">My Orders</Txt>
        <Txt variant="caption">Track deliveries in real time</Txt>
      </View>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message="Couldn't load orders" onRetry={load} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(i) => i.id}
          contentContainerStyle={[styles.list, { paddingBottom: 68 + insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.brand}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/order/${item.id}`)}
              testID={`order-card-${item.id}`}
            >
              <View style={styles.cardTop}>
                <View>
                  <Txt variant="subtitle">{item.order_number}</Txt>
                  <Txt variant="caption">
                    {timeAgo(item.created_at)} · {item.items.reduce((s, i) => s + i.qty, 0)} items
                  </Txt>
                </View>
                <StatusBadge status={item.status} />
              </View>

              <View style={styles.thumbs}>
                {item.items.slice(0, 4).map((it, i) => (
                  <Image key={i} source={{ uri: it.image_url }} style={styles.thumb} contentFit="cover" />
                ))}
                {item.items.length > 4 ? (
                  <View style={[styles.thumb, styles.moreThumb]}>
                    <Txt variant="label">+{item.items.length - 4}</Txt>
                  </View>
                ) : null}
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.addr}>
                  <Ionicons name="location-outline" size={14} color={colors.muted} />
                  <Txt variant="caption" style={styles.addrTxt}>
                    {item.address.building} · {item.address.room}
                  </Txt>
                </View>
                <Txt variant="subtitle" color={colors.brand}>
                  {money(item.total)}
                </Txt>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState
              title="No orders yet"
              subtitle="Your snack runs will show up here."
              icon="receipt-outline"
              cta="Start Shopping"
              onCta={() => router.push("/(customer)")}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  top: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  list: { padding: spacing.lg, flexGrow: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  thumbs: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  thumb: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.surfaceTertiary },
  moreThumb: { alignItems: "center", justifyContent: "center" },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  addr: { flexDirection: "row", alignItems: "center", flex: 1 },
  addrTxt: { marginLeft: 4 },
});
