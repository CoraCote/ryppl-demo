import React, { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";
import { useCart } from "@/src/context/CartContext";
import { colors, font, radius, shadow, spacing } from "@/src/theme";
import { money } from "@/src/lib/format";
import { Txt } from "@/src/components/Txt";
import { Button } from "@/src/components/Button";
import { Header } from "@/src/components/Header";
import { QuantityStepper } from "@/src/components/QuantityStepper";
import { TipSelector } from "@/src/components/TipSelector";
import { EmptyState } from "@/src/components/States";

const BUILDINGS = [
  { name: "Mason Hall", x: 0.22, y: 0.28 },
  { name: "West Quad", x: 0.7, y: 0.2 },
  { name: "South Hall", x: 0.3, y: 0.7 },
  { name: "Bursley Hall", x: 0.78, y: 0.64 },
  { name: "The Union", x: 0.5, y: 0.46 },
  { name: "Markley Hall", x: 0.16, y: 0.56 },
  { name: "East Quad", x: 0.44, y: 0.82 },
];

const DELIVERY_FEE = 1.99;

export default function Cart() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refresh } = useAuth();
  const { items, subtotal, setQty, remove, clear } = useCart();

  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; discount: number; message: string } | null>(null);
  const [promoErr, setPromoErr] = useState("");
  const [applying, setApplying] = useState(false);
  const [tip, setTip] = useState(2);
  const [customTip, setCustomTip] = useState("");
  const [building, setBuilding] = useState(0);
  const [room, setRoom] = useState("");
  const [placing, setPlacing] = useState(false);

  const discount = promo?.discount ?? 0;
  const total = Math.max(0, subtotal - discount) + tip + DELIVERY_FEE;

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setApplying(true);
    setPromoErr("");
    try {
      const res = await api<{ valid: boolean; discount: number; message: string; code?: string }>(
        "/promo/validate",
        { method: "POST", body: { code: promoInput.trim(), subtotal } },
      );
      if (res.valid) {
        setPromo({ code: res.code || promoInput.trim().toUpperCase(), discount: res.discount, message: res.message });
        setPromoErr("");
      } else {
        setPromo(null);
        setPromoErr(res.message);
      }
    } catch {
      setPromoErr("Couldn't validate code");
    } finally {
      setApplying(false);
    }
  };

  const placeOrder = async () => {
    if (!room.trim()) {
      setPromoErr("");
      return;
    }
    setPlacing(true);
    try {
      const b = BUILDINGS[building];
      const order = await api<{ id: string }>("/orders", {
        method: "POST",
        body: {
          items: items.map((i) => ({
            product_id: i.product_id,
            name: i.name,
            price: i.price,
            qty: i.qty,
            image_url: i.image_url,
          })),
          tip,
          promo_code: promo?.code ?? null,
          address: { building: b.name, room: room.trim(), x: b.x, y: b.y },
          payment_method: "Visa •••• 4242",
        },
      });
      clear();
      await refresh();
      router.replace(`/order/${order.id}`);
    } catch {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <Header title="Your Cart" showBack />
        <EmptyState
          title="Your bag is empty"
          subtitle="Add some snacks and they'll show up here."
          icon="bag-handle-outline"
          cta="Browse Products"
          onCta={() => router.replace("/(customer)")}
        />
      </View>
    );
  }

  const roomValid = room.trim().length > 0;

  return (
    <View style={styles.container}>
      <Header title="Your Cart" subtitle={`${items.length} items`} showBack />

      <KeyboardAwareScrollView
        bottomOffset={120}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Items */}
        <View style={styles.card}>
          {items.map((item, idx) => (
            <View key={item.product_id}>
              {idx > 0 ? <View style={styles.divider} /> : null}
              <View style={styles.itemRow}>
                <Image source={{ uri: item.image_url }} style={styles.itemImg} contentFit="cover" />
                <View style={styles.itemInfo}>
                  <Txt variant="subtitle" numberOfLines={1}>
                    {item.name}
                  </Txt>
                  <Txt variant="subtitle" color={colors.brand}>
                    {money(item.price)}
                  </Txt>
                </View>
                <View style={styles.itemRight}>
                  <QuantityStepper
                    value={item.qty}
                    onChange={(v) => setQty(item.product_id, v)}
                    size="sm"
                    testID={`cart-qty-${item.product_id}`}
                  />
                  <Pressable onPress={() => remove(item.product_id)} hitSlop={8} testID={`remove-${item.product_id}`}>
                    <Txt variant="caption" color={colors.error} style={styles.removeTxt}>
                      Remove
                    </Txt>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Promo */}
        <Txt variant="label" style={styles.blockLabel}>
          PROMO CODE
        </Txt>
        <View style={styles.promoRow}>
          <View style={styles.promoInputWrap}>
            <Ionicons name="pricetag-outline" size={18} color={colors.muted} />
            <TextInput
              value={promoInput}
              onChangeText={(t) => setPromoInput(t.toUpperCase())}
              placeholder="Enter code"
              placeholderTextColor={colors.muted}
              autoCapitalize="characters"
              style={styles.promoInput}
              testID="promo-input"
            />
          </View>
          <Button title="Apply" size="md" fullWidth={false} variant="secondary" loading={applying} onPress={applyPromo} testID="apply-promo" />
        </View>
        {promo ? (
          <View style={styles.promoOk}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Txt variant="caption" color={colors.success} style={styles.promoMsg}>
              {promo.message} · −{money(promo.discount)}
            </Txt>
          </View>
        ) : promoErr ? (
          <Txt variant="caption" color={colors.error} style={styles.promoMsg}>
            {promoErr}
          </Txt>
        ) : null}

        {/* Tip */}
        <Txt variant="label" style={styles.blockLabel}>
          ADD A TIP FOR YOUR RUNNER
        </Txt>
        <TipSelector value={tip} onChange={setTip} custom={customTip} onCustom={setCustomTip} />

        {/* Address */}
        <Txt variant="label" style={styles.blockLabel}>
          DELIVERY LOCATION
        </Txt>
        <View style={styles.buildingRow}>
          {BUILDINGS.map((b, i) => (
            <Pressable
              key={b.name}
              onPress={() => setBuilding(i)}
              style={[styles.buildingChip, building === i && styles.buildingChipActive]}
              testID={`building-${i}`}
            >
              <Txt variant="label" color={building === i ? colors.onBrandSecondary : colors.onSurfaceSecondary}>
                {b.name}
              </Txt>
            </Pressable>
          ))}
        </View>
        <View style={styles.roomWrap}>
          <Ionicons name="location-outline" size={18} color={colors.muted} />
          <TextInput
            value={room}
            onChangeText={setRoom}
            placeholder="Room / apt number (e.g. 214B)"
            placeholderTextColor={colors.muted}
            style={styles.roomInput}
            testID="room-input"
          />
        </View>

        {/* Payment */}
        <Txt variant="label" style={styles.blockLabel}>
          PAYMENT METHOD
        </Txt>
        <View style={styles.payRow}>
          <View style={styles.payLeft}>
            <View style={styles.cardIcon}>
              <Ionicons name="card" size={18} color="#FFFFFF" />
            </View>
            <Txt variant="body">Visa •••• 4242</Txt>
          </View>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <SummaryRow label="Subtotal" value={money(subtotal)} />
          {discount > 0 ? <SummaryRow label="Discount" value={`−${money(discount)}`} accent={colors.success} /> : null}
          <SummaryRow label="Delivery fee" value={money(DELIVERY_FEE)} />
          <SummaryRow label="Runner tip" value={money(tip)} />
          <View style={styles.divider} />
          <SummaryRow label="Total" value={money(total)} bold />
        </View>
      </KeyboardAwareScrollView>

      <KeyboardStickyView>
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          {!roomValid ? (
            <Txt variant="caption" color={colors.warning} style={styles.footerHint}>
              Add your room number to place the order
            </Txt>
          ) : null}
          <Button
            title={`Place Order · ${money(total)}`}
            icon="lock-closed"
            disabled={!roomValid}
            loading={placing}
            onPress={placeOrder}
            testID="place-order-button"
          />
        </View>
      </KeyboardStickyView>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  accent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: string;
}) {
  return (
    <View style={styles.sumRow}>
      <Txt variant={bold ? "subtitle" : "body"} color={bold ? colors.onSurface : colors.muted}>
        {label}
      </Txt>
      <Txt variant={bold ? "heading" : "subtitle"} color={accent || (bold ? colors.brand : colors.onSurface)}>
        {value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.soft,
  },
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm },
  itemImg: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.surfaceTertiary },
  itemInfo: { flex: 1, marginLeft: spacing.md, gap: 2 },
  itemRight: { alignItems: "flex-end", gap: 6 },
  removeTxt: { fontFamily: font.semibold },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.sm },
  blockLabel: { marginTop: spacing.xl, marginBottom: spacing.md, marginLeft: spacing.xs },
  promoRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  promoInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  promoInput: { flex: 1, marginLeft: spacing.sm, fontFamily: font.medium, fontSize: 15, color: colors.onSurface },
  promoOk: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm, gap: 4 },
  promoMsg: { marginTop: spacing.sm },
  buildingRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  buildingChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  buildingChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  roomWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  roomInput: { flex: 1, marginLeft: spacing.sm, fontFamily: font.medium, fontSize: 15, color: colors.onSurface },
  payRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadow.soft,
  },
  payLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  summary: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
    ...shadow.soft,
  },
  sumRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 5 },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  footerHint: { textAlign: "center", marginBottom: spacing.sm },
});
