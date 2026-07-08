import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing } from "@/src/theme";
import { Txt } from "./Txt";

export type Category = { key: string; icon: keyof typeof Ionicons.glyphMap };

interface Props {
  categories: Category[];
  active: string;
  onSelect: (key: string) => void;
}

// Horizontal, non-wrapping chip row (chrome). Selected chip changes color only.
export function CategoryChips({ categories, active, onSelect }: Props) {
  const all: Category[] = [{ key: "All", icon: "grid" }, ...categories];
  return (
    <View style={styles.row}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {all.map((c) => {
          const selected = active === c.key;
          return (
            <Pressable
              key={c.key}
              onPress={() => onSelect(c.key)}
              style={[styles.chip, selected ? styles.chipActive : styles.chipIdle]}
              testID={`category-${c.key}`}
            >
              <Ionicons
                name={c.icon}
                size={15}
                color={selected ? colors.onBrandSecondary : colors.onSurfaceSecondary}
              />
              <Txt
                variant="label"
                color={selected ? colors.onBrandSecondary : colors.onSurfaceSecondary}
                style={styles.chipTxt}
              >
                {c.key}
              </Txt>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: 56, justifyContent: "center" },
  content: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  chip: {
    flexShrink: 0,
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  chipIdle: { backgroundColor: colors.surface, borderColor: colors.border },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipTxt: { marginLeft: 6 },
});
