import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing } from "@/src/theme";
import { Txt } from "./Txt";

interface Props {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: React.ReactNode;
  onBack?: () => void;
}

export function Header({ title, subtitle, showBack, right, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.left}>
        {showBack ? (
          <Pressable
            onPress={() => (onBack ? onBack() : router.back())}
            style={styles.backBtn}
            testID="header-back"
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
          </Pressable>
        ) : null}
        <View style={styles.titles}>
          <Txt variant="title" numberOfLines={1}>
            {title}
          </Txt>
          {subtitle ? <Txt variant="caption">{subtitle}</Txt> : null}
        </View>
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  left: { flexDirection: "row", alignItems: "center", flex: 1 },
  backBtn: { marginRight: spacing.sm },
  titles: { flex: 1 },
});
