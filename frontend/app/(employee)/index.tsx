import React, { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";
import { colors, radius, shadow, spacing } from "@/src/theme";
import { Txt } from "@/src/components/Txt";
import { OrderQueueCard, QueueOrder } from "@/src/components/OrderQueueCard";
import { LoadingState, ErrorState, EmptyState } from "@/src/components/States";

export default function Queue() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [role, setRole] = useState<"packer" | "runner">(user?.sub_role === "runner" ? "runner" : "packer");
  const [orders, setOrders] = useState<QueueOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const load = useCallback(
    async (r: "packer" | "runner") => {
      setError(false);
      try {
        const data = await api<QueueOrder[]>(`/employee/queue?role=${r}`);
        setOrders(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load(role);
      const t = setInterval(() => load(role), 5000);
      return () => clearInterval(t);
    }, [role, load]),
  );

  const switchRole = (r: "packer" | "runner") => {
    setRole(r);
    setLoading(true);
    load(r);
  };

  const claim = async (orderId: string) => {
    setClaimingId(orderId);
    try {
      await api(`/orders/${orderId}/claim`, { method: "POST", body: { as_role: role } });
      router.push(`/delivery/${orderId}`);
    } catch (e: any) {
      load(role);
    } finally {
      setClaimingId(null);
    }
  };

  const claimable = orders.filter((o) =>
    role === "packer" ? o.status === "incoming" : o.status === "ready",
  ).length;

  return (
    <View style={styles.container}>
      <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <View>
            <Txt variant="caption" color="#CBD5E1">
              {user?.sub_role === "runner" ? "Runner" : "Packer"} · {user?.name}
            </Txt>
            <Txt variant="title" color="#FFFFFF">
              Order Queue
            </Txt>
          </View>
          <View style={styles.countBadge}>
            <Txt variant="heading" color={colors.brand}>
              {claimable}
            </Txt>
            <Txt variant="caption" color={colors.brand}>
              open
            </Txt>
          </View>
        </View>

        <View style={styles.segment}>
          {(["packer", "runner"] as const).map((r) => (
            <Pressable
              key={r}
              onPress={() => switchRole(r)}
              style={[styles.segItem, role === r && styles.segItemActive]}
              testID={`segment-${r}`}
            >
              <Ionicons
                name={r === "packer" ? "cube" : "bicycle"}
                size={16}
                color={role === r ? colors.brand : "#CBD5E1"}
              />
              <Txt variant="subtitle" color={role === r ? colors.brand : "#CBD5E1"} style={styles.segTxt}>
                {r === "packer" ? "Packer" : "Runner"}
              </Txt>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <LoadingState label="Loading queue…" />
      ) : error ? (
        <ErrorState message="Couldn't load the queue" onRetry={() => load(role)} />
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
                load(role);
              }}
              tintColor={colors.brand}
            />
          }
          renderItem={({ item }) => (
            <OrderQueueCard
              order={item}
              role={role}
              meId={user?.id}
              packerId={(item as any).packer_id}
              runnerId={(item as any).runner_id}
              claiming={claimingId === item.id}
              onClaim={() => claim(item.id)}
              onOpen={() => router.push(`/delivery/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title="All caught up!"
              subtitle={role === "packer" ? "No orders waiting to be packed." : "No packed orders to deliver."}
              icon="cafe-outline"
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
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  countBadge: {
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
    minWidth: 60,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: radius.pill,
    padding: 4,
  },
  segItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    gap: 6,
  },
  segItemActive: { backgroundColor: colors.brandPrimary, ...shadow.soft },
  segTxt: {},
  list: { padding: spacing.lg, flexGrow: 1 },
});
