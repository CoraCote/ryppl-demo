import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing } from "@/src/theme";
import { Txt } from "./Txt";
import { Button } from "./Button";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <View style={styles.center} testID="loading-state">
      <ActivityIndicator size="large" color={colors.brand} />
      <Txt variant="bodyMuted" style={styles.mt}>
        {label}
      </Txt>
    </View>
  );
}

export function ErrorState({
  message = "Something went wrong",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.center} testID="error-state">
      <View style={[styles.iconWrap, { backgroundColor: "#FEE2E2" }]}>
        <Ionicons name="cloud-offline-outline" size={34} color={colors.error} />
      </View>
      <Txt variant="subtitle" center style={styles.mt}>
        {message}
      </Txt>
      {onRetry ? (
        <View style={styles.retry}>
          <Button title="Try Again" variant="secondary" fullWidth={false} onPress={onRetry} testID="retry-button" />
        </View>
      ) : null}
    </View>
  );
}

export function EmptyState({
  title,
  subtitle,
  icon = "cube-outline",
  image,
  cta,
  onCta,
}: {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  image?: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <View style={styles.center} testID="empty-state">
      {image ? (
        <Image source={{ uri: image }} style={styles.emptyImg} contentFit="contain" />
      ) : (
        <View style={[styles.iconWrap, { backgroundColor: colors.brandTertiary }]}>
          <Ionicons name={icon} size={38} color={colors.brand} />
        </View>
      )}
      <Txt variant="heading" center style={styles.mt}>
        {title}
      </Txt>
      {subtitle ? (
        <Txt variant="bodyMuted" center style={styles.sub}>
          {subtitle}
        </Txt>
      ) : null}
      {cta && onCta ? (
        <View style={styles.retry}>
          <Button title={cta} fullWidth={false} onPress={onCta} testID="empty-cta-button" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  mt: { marginTop: spacing.lg },
  sub: { marginTop: spacing.sm, maxWidth: 280 },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyImg: { width: 160, height: 160, borderRadius: 24 },
  retry: { marginTop: spacing.xl },
});
