import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, shadow, spacing } from "@/src/theme";
import { money, timeAgo } from "@/src/lib/format";
import { Txt } from "./Txt";
import { StatusBadge } from "./StatusBadge";
import { Button } from "./Button";

export type QueueOrder = {
  id: string;
  order_number: string;
  status: string;
  items: { qty: number }[];
  total: number;
  address: { building: string; room: string };
  created_at: string;
};

interface Props {
  order: QueueOrder;
  role: "packer" | "runner";
  meId?: string;
  packerId?: string | null;
  runnerId?: string | null;
  onClaim: () => void;
  onOpen: () => void;
  claiming?: boolean;
}

export function OrderQueueCard({
  order,
  role,
  meId,
  packerId,
  runnerId,
  onClaim,
  onOpen,
  claiming,
}: Props) {
  const itemCount = order.items.reduce((s, i) => s + i.qty, 0);
  const claimable =
    (role === "packer" && order.status === "incoming") ||
    (role === "runner" && order.status === "ready");
  const mine =
    (role === "packer" && packerId === meId) ||
    (role === "runner" && runnerId === meId);

  return (
    <View style={styles.card} testID={`queue-card-${order.id}`}>
      <View style={styles.top}>
        <View>
          <Txt variant="heading">{order.order_number}</Txt>
          <Txt variant="caption">{timeAgo(order.created_at)}</Txt>
        </View>
        <StatusBadge status={order.status} />
      </View>

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Ionicons name="cube-outline" size={16} color={colors.muted} />
          <Txt variant="label" style={styles.metaTxt}>
            {itemCount} items
          </Txt>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={16} color={colors.muted} />
          <Txt variant="label" style={styles.metaTxt} numberOfLines={1}>
            {order.address.building} · {order.address.room}
          </Txt>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="cash-outline" size={16} color={colors.muted} />
          <Txt variant="label" style={styles.metaTxt}>
            {money(order.total)}
          </Txt>
        </View>
      </View>

      {claimable ? (
        <Button
          title={role === "packer" ? "Claim (Packer)" : "Claim (Runner)"}
          variant={role === "packer" ? "success" : "danger"}
          loading={claiming}
          onPress={onClaim}
          icon="hand-left-outline"
          testID={`claim-${order.id}`}
        />
      ) : (
        <Button
          title={mine ? "Continue Order" : "View Order"}
          variant="secondary"
          onPress={onOpen}
          icon="arrow-forward"
          testID={`open-${order.id}`}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  top: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  meta: { gap: spacing.sm, marginBottom: spacing.lg },
  metaItem: { flexDirection: "row", alignItems: "center" },
  metaTxt: { marginLeft: spacing.sm, flexShrink: 1 },
});
