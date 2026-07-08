import React from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { colors, font, radius, spacing } from "@/src/theme";
import { Txt } from "./Txt";

const PRESETS = [0, 1, 2, 5];

interface Props {
  value: number;
  onChange: (v: number) => void;
  custom: string;
  onCustom: (v: string) => void;
}

export function TipSelector({ value, onChange, custom, onCustom }: Props) {
  const isCustom = custom.length > 0;
  return (
    <View>
      <View style={styles.row}>
        {PRESETS.map((p) => {
          const selected = !isCustom && value === p;
          return (
            <Pressable
              key={p}
              onPress={() => {
                onCustom("");
                onChange(p);
              }}
              style={[styles.pill, selected ? styles.pillActive : styles.pillIdle]}
              testID={`tip-${p}`}
            >
              <Txt
                variant="subtitle"
                color={selected ? colors.onBrandPrimary : colors.onSurfaceSecondary}
              >
                {p === 0 ? "None" : `$${p}`}
              </Txt>
            </Pressable>
          );
        })}
      </View>
      <View style={[styles.customWrap, isCustom && styles.customActive]}>
        <Txt variant="subtitle" color={colors.muted}>
          $
        </Txt>
        <TextInput
          value={custom}
          onChangeText={(t) => {
            const clean = t.replace(/[^0-9.]/g, "");
            onCustom(clean);
            onChange(parseFloat(clean) || 0);
          }}
          placeholder="Custom tip amount"
          placeholderTextColor={colors.muted}
          keyboardType="decimal-pad"
          style={styles.input}
          testID="tip-custom-input"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.sm },
  pill: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  pillIdle: { backgroundColor: colors.surface, borderColor: colors.border },
  pillActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brand },
  customWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  customActive: { borderColor: colors.brand },
  input: {
    flex: 1,
    height: 48,
    marginLeft: spacing.xs,
    fontFamily: font.medium,
    fontSize: 15,
    color: colors.onSurface,
  },
});
