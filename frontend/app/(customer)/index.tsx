import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";
import { useCart } from "@/src/context/CartContext";
import { colors, radius, shadow, spacing } from "@/src/theme";
import { money } from "@/src/lib/format";
import { Txt } from "@/src/components/Txt";
import { CategoryChips, Category } from "@/src/components/CategoryChips";
import { ProductCard, Product } from "@/src/components/ProductCard";
import { LoadingState, ErrorState, EmptyState } from "@/src/components/States";

const HERO_IMG = "https://images.pexels.com/photos/11251717/pexels-photo-11251717.jpeg";

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { add, count, subtotal, qtyOf } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [active, setActive] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const [prods, cats] = await Promise.all([
        api<Product[]>("/products"),
        api<Category[]>("/categories"),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => (active === "All" ? products : products.filter((p) => p.category === active)),
    [products, active],
  );

  const addToCart = (p: Product) =>
    add({ product_id: p.id, name: p.name, price: p.price, image_url: p.image_url });

  const header = (
    <View>
      <Pressable style={styles.hero} onPress={() => router.push("/(customer)/explore")}>
        <Image source={{ uri: HERO_IMG }} style={styles.heroImg} contentFit="cover" />
        <LinearGradient
          colors={["rgba(10,35,66,0.2)", "rgba(10,35,66,0.9)"]}
          style={styles.heroOverlay}
        >
          <View style={styles.heroTag}>
            <Ionicons name="flash" size={13} color={colors.brand} />
            <Txt variant="caption" color={colors.brand} style={styles.heroTagTxt}>
              LATE NIGHT DEALS
            </Txt>
          </View>
          <Txt variant="title" color="#FFFFFF">
            20% off energy & snacks
          </Txt>
          <Txt variant="body" color="#CBD5E1">
            Use code RYPPL20 at checkout
          </Txt>
        </LinearGradient>
      </Pressable>

      <View style={styles.sectionRow}>
        <Txt variant="heading">{active === "All" ? "Popular right now" : active}</Txt>
        <Txt variant="caption">{filtered.length} items</Txt>
      </View>
    </View>
  );

  const bottomPad = 68 + insets.bottom + (count > 0 ? 76 : 0) + spacing.lg;

  return (
    <View style={styles.container}>
      {/* Sticky top: greeting + search + categories */}
      <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.greetRow}>
          <View style={styles.flex}>
            <Txt variant="caption">Deliver to your dorm</Txt>
            <Txt variant="heading" numberOfLines={1}>
              Hey {user?.name?.split(" ")[0] || "there"} 👋
            </Txt>
          </View>
          <View style={styles.pointsChip}>
            <Ionicons name="star" size={14} color={colors.brand} />
            <Txt variant="label" color={colors.brand} style={styles.pointsTxt}>
              {user?.points ?? 0} pts
            </Txt>
          </View>
        </View>

        <Pressable
          style={styles.search}
          onPress={() => router.push("/(customer)/explore")}
          testID="home-search"
        >
          <Ionicons name="search" size={20} color={colors.muted} />
          <Txt variant="body" color={colors.muted} style={styles.searchTxt}>
            Search snacks, drinks, meals…
          </Txt>
        </Pressable>

        <CategoryChips categories={categories} active={active} onSelect={setActive} />
      </View>

      {loading ? (
        <LoadingState label="Loading the shelves…" />
      ) : error ? (
        <ErrorState message="Couldn't load products" onRetry={load} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.column}
          ListHeaderComponent={header}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
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
            <ProductCard
              product={item}
              qty={qtyOf(item.id)}
              onPress={() => router.push(`/product/${item.id}`)}
              onAdd={() => addToCart(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState title="No items here" subtitle="Try a different category." icon="basket-outline" />
          }
        />
      )}

      {count > 0 && (
        <Pressable
          style={[styles.cartBar, { bottom: 68 + insets.bottom + spacing.sm }]}
          onPress={() => router.push("/cart")}
          testID="floating-cart-bar"
        >
          <View style={styles.cartCount}>
            <Txt variant="subtitle" color={colors.onBrandPrimary}>
              {count}
            </Txt>
          </View>
          <Txt variant="subtitle" color="#FFFFFF" style={styles.flex}>
            View Cart
          </Txt>
          <Txt variant="subtitle" color={colors.brandPrimary}>
            {money(subtotal)}
          </Txt>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.cartArrow} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  flex: { flex: 1 },
  top: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  greetRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  pointsChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  pointsTxt: { marginLeft: 4 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 50,
    marginBottom: spacing.xs,
  },
  searchTxt: { marginLeft: spacing.sm },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  column: { gap: spacing.md, marginBottom: spacing.md },
  hero: {
    height: 160,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  heroImg: { ...StyleSheet.absoluteFillObject },
  heroOverlay: { flex: 1, justifyContent: "flex-end", padding: spacing.lg },
  heroTag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  heroTagTxt: { marginLeft: 4, fontFamily: "PlusJakartaSans-ExtraBold" },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  cartBar: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    height: 60,
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    ...shadow.floating,
  },
  cartCount: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  cartArrow: { marginLeft: spacing.sm },
});
