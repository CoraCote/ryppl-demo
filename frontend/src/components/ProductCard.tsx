import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, shadow, spacing } from "@/src/theme";
import { money } from "@/src/lib/format";
import { Txt } from "./Txt";

export type Product = {
  id: string;
  name: string;
  price: number;
  weight: string;
  category: string;
  image_url: string;
  in_stock: boolean;
  rating: number;
};

interface Props {
  product: Product;
  onPress: () => void;
  onAdd: () => void;
  qty?: number;
}

export function ProductCard({ product, onPress, onAdd, qty = 0 }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      testID={`product-card-${product.id}`}
    >
      <View style={styles.imgWrap}>
        <Image source={{ uri: product.image_url }} style={styles.img} contentFit="cover" transition={200} />
        <View style={styles.ratingPill}>
          <Ionicons name="star" size={11} color={colors.brandPrimary} />
          <Txt variant="caption" color={colors.onSurfaceInverse} style={styles.ratingTxt}>
            {product.rating.toFixed(1)}
          </Txt>
        </View>
        {!product.in_stock && (
          <View style={styles.oos}>
            <Txt variant="caption" color={colors.onSurfaceInverse}>
              Out of stock
            </Txt>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Txt variant="subtitle" numberOfLines={1}>
          {product.name}
        </Txt>
        <Txt variant="caption" style={styles.weight}>
          {product.weight}
        </Txt>

        <View style={styles.footer}>
          <Txt style={styles.price}>{money(product.price)}</Txt>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              onAdd();
            }}
            style={styles.addBtn}
            testID={`add-product-${product.id}`}
          >
            {qty > 0 ? (
              <Txt variant="subtitle" color={colors.onBrandPrimary}>
                {qty}
              </Txt>
            ) : (
              <Ionicons name="add" size={22} color={colors.onBrandPrimary} />
            )}
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadow.card,
  },
  pressed: { transform: [{ scale: 0.98 }] },
  imgWrap: { backgroundColor: colors.surfaceTertiary, aspectRatio: 1.15 },
  img: { width: "100%", height: "100%" },
  ratingPill: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  ratingTxt: { marginLeft: 3 },
  oos: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.overlay,
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  body: { padding: spacing.md },
  weight: { marginTop: 2 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  price: { fontFamily: "PlusJakartaSans-ExtraBold", fontSize: 18, color: colors.brand },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
});
