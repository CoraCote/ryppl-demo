import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/api/client";
import { useCart } from "@/src/context/CartContext";
import { colors, radius, shadow, spacing } from "@/src/theme";
import { money } from "@/src/lib/format";
import { Txt } from "@/src/components/Txt";
import { Button } from "@/src/components/Button";
import { QuantityStepper } from "@/src/components/QuantityStepper";
import { LoadingState, ErrorState } from "@/src/components/States";

type Detail = {
  id: string;
  name: string;
  description: string;
  price: number;
  weight: string;
  category: string;
  image_url: string;
  in_stock: boolean;
  rating: number;
  sizes: string[];
};

export default function ProductDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { add } = useCart();

  const [product, setProduct] = useState<Detail | null>(null);
  const [error, setError] = useState(false);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState(0);

  const load = async () => {
    setError(false);
    try {
      const p = await api<Detail>(`/products/${id}`);
      setProduct(p);
    } catch {
      setError(true);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const addAndClose = () => {
    if (!product) return;
    add(
      {
        product_id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
      },
      qty,
    );
    router.back();
  };

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorState message="Couldn't load product" onRetry={load} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <LoadingState />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.imgWrap}>
          <Image source={{ uri: product.image_url }} style={styles.img} contentFit="cover" />
          <LinearGradient colors={["transparent", "rgba(255,255,255,0.9)"]} style={styles.imgScrim} />
          <Pressable
            style={[styles.closeBtn, { top: insets.top + spacing.sm }]}
            onPress={() => router.back()}
            testID="product-close"
          >
            <Ionicons name="close" size={22} color={colors.onSurface} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={styles.flex}>
              <Txt variant="caption" color={colors.brand}>
                {product.category.toUpperCase()}
              </Txt>
              <Txt variant="title" style={styles.name}>
                {product.name}
              </Txt>
              <Txt variant="caption">{product.weight}</Txt>
            </View>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={14} color={colors.brandPrimary} />
              <Txt variant="label" color="#FFFFFF" style={styles.ratingTxt}>
                {product.rating.toFixed(1)}
              </Txt>
            </View>
          </View>

          <Txt variant="body" color={colors.onSurfaceSecondary} style={styles.desc}>
            {product.description}
          </Txt>

          {product.sizes.length > 0 && (
            <View style={styles.section}>
              <Txt variant="label" style={styles.sectionLabel}>
                SIZE
              </Txt>
              <View style={styles.sizeRow}>
                {product.sizes.map((s, i) => (
                  <Pressable
                    key={s}
                    onPress={() => setSize(i)}
                    style={[styles.sizeChip, size === i && styles.sizeChipActive]}
                    testID={`size-${s}`}
                  >
                    <Txt
                      variant="label"
                      color={size === i ? colors.onBrandSecondary : colors.onSurfaceSecondary}
                    >
                      {s}
                    </Txt>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Txt variant="label" style={styles.sectionLabel}>
              QUANTITY
            </Txt>
            <QuantityStepper value={qty} onChange={setQty} min={1} testID="detail-qty" />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.priceCol}>
          <Txt variant="caption">Total</Txt>
          <Txt variant="heading" color={colors.brand}>
            {money(product.price * qty)}
          </Txt>
        </View>
        <View style={styles.flex}>
          <Button
            title={product.in_stock ? "Add to Cart" : "Out of Stock"}
            icon="bag-add"
            disabled={!product.in_stock}
            onPress={addAndClose}
            testID="add-to-cart-button"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  imgWrap: { height: 340, backgroundColor: colors.surfaceTertiary },
  img: { width: "100%", height: "100%" },
  imgScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: 60 },
  closeBtn: {
    position: "absolute",
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  body: { padding: spacing.xl },
  titleRow: { flexDirection: "row", alignItems: "flex-start" },
  name: { marginVertical: 2 },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  ratingTxt: { marginLeft: 4 },
  desc: { marginTop: spacing.md, lineHeight: 22 },
  section: { marginTop: spacing.xl },
  sectionLabel: { marginBottom: spacing.md },
  sizeRow: { flexDirection: "row", gap: spacing.sm },
  sizeChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sizeChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  priceCol: {},
});
