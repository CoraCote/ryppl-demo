import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/api/client";
import { useCart } from "@/src/context/CartContext";
import { storage } from "@/src/utils/storage";
import { colors, font, radius, spacing } from "@/src/theme";
import { Txt } from "@/src/components/Txt";
import { ProductCard, Product } from "@/src/components/ProductCard";
import { LoadingState, EmptyState } from "@/src/components/States";

const RECENT_KEY = "ryppl_recent";

export default function Explore() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { add, qtyOf } = useCart();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [trending, setTrending] = useState<Product[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const t = await api<Product[]>("/products/trending");
      setTrending(t);
      const raw = await storage.getItem<string>(RECENT_KEY, "");
      if (raw) {
        try {
          setRecent(JSON.parse(raw));
        } catch {}
      }
    })();
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const r = await api<Product[]>(`/products?search=${encodeURIComponent(q)}`);
      setResults(r);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onChange = (t: string) => {
    setQuery(t);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(t), 300);
  };

  const saveRecent = async (term: string) => {
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 6);
    setRecent(next);
    await storage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  const addToCart = (p: Product) =>
    add({ product_id: p.id, name: p.name, price: p.price, image_url: p.image_url });

  const showResults = query.trim().length > 0;

  return (
    <View style={styles.container}>
      <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]}>
        <Txt variant="title" style={styles.title}>
          Explore
        </Txt>
        <View style={styles.search}>
          <Ionicons name="search" size={20} color={colors.muted} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={onChange}
            onSubmitEditing={() => query.trim() && saveRecent(query.trim())}
            placeholder="Search snacks, drinks, meals…"
            placeholderTextColor={colors.muted}
            style={styles.input}
            returnKeyType="search"
            testID="explore-search-input"
          />
          {query ? (
            <Pressable onPress={() => onChange("")} hitSlop={8} testID="clear-search">
              <Ionicons name="close-circle" size={20} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {loading ? (
        <LoadingState label="Searching…" />
      ) : showResults ? (
        <FlatList
          data={results}
          keyExtractor={(i) => i.id}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={[styles.list, { paddingBottom: 68 + insets.bottom + spacing.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              qty={qtyOf(item.id)}
              onPress={() => router.push(`/product/${item.id}`)}
              onAdd={() => addToCart(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title="No results"
              subtitle={`Nothing found for "${query}". Try another term.`}
              icon="search-outline"
            />
          }
        />
      ) : (
        <FlatList
          data={trending}
          keyExtractor={(i) => i.id}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={[styles.list, { paddingBottom: 68 + insets.bottom + spacing.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {recent.length > 0 && (
                <View style={styles.recentBlock}>
                  <Txt variant="label" style={styles.blockLabel}>
                    RECENT SEARCHES
                  </Txt>
                  <View style={styles.recentRow}>
                    {recent.map((r) => (
                      <Pressable
                        key={r}
                        style={styles.recentChip}
                        onPress={() => onChange(r)}
                        testID={`recent-${r}`}
                      >
                        <Ionicons name="time-outline" size={14} color={colors.muted} />
                        <Txt variant="label" style={styles.recentTxt}>
                          {r}
                        </Txt>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
              <View style={styles.trendHeader}>
                <Ionicons name="trending-up" size={18} color={colors.brand} />
                <Txt variant="heading" style={styles.trendTitle}>
                  Trending on campus
                </Txt>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              qty={qtyOf(item.id)}
              onPress={() => router.push(`/product/${item.id}`)}
              onAdd={() => addToCart(item)}
            />
          )}
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
  title: { marginBottom: spacing.md },
  search: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  input: {
    flex: 1,
    marginHorizontal: spacing.sm,
    fontFamily: font.medium,
    fontSize: 16,
    color: colors.onSurface,
  },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  column: { gap: spacing.md, marginBottom: spacing.md },
  recentBlock: { marginBottom: spacing.lg },
  blockLabel: { marginBottom: spacing.sm },
  recentRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  recentChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    gap: 4,
  },
  recentTxt: {},
  trendHeader: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md, gap: 6 },
  trendTitle: {},
});
