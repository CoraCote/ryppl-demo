import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, STATUS_META, TIMELINE_STEPS } from "@/src/theme";
import { Txt } from "./Txt";

export function OrderTimeline({ currentStatus }: { currentStatus: string }) {
  const currentStep = STATUS_META[currentStatus]?.step ?? 0;

  return (
    <View style={styles.wrap} testID="order-timeline">
      {TIMELINE_STEPS.map((step, idx) => {
        const meta = STATUS_META[step];
        const done = idx < currentStep;
        const active = idx === currentStep;
        const reached = done || active;
        const nodeColor = active
          ? colors.brandPrimary
          : done
            ? colors.success
            : colors.border;

        return (
          <View key={step} style={styles.row}>
            <View style={styles.railCol}>
              <View
                style={[
                  styles.node,
                  { backgroundColor: nodeColor, borderColor: active ? colors.brand : "transparent" },
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={14} color={colors.onSuccess} />
                ) : active ? (
                  <View style={styles.pulse} />
                ) : null}
              </View>
              {idx < TIMELINE_STEPS.length - 1 && (
                <View
                  style={[
                    styles.line,
                    { backgroundColor: idx < currentStep ? colors.success : colors.border },
                  ]}
                />
              )}
            </View>
            <View style={styles.textCol}>
              <Txt
                variant={active ? "subtitle" : "body"}
                color={reached ? colors.onSurface : colors.muted}
              >
                {meta.label}
              </Txt>
              {active ? (
                <Txt variant="caption" color={colors.brand} style={styles.now}>
                  In progress
                </Txt>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: spacing.sm },
  row: { flexDirection: "row" },
  railCol: { alignItems: "center", width: 34 },
  node: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand },
  line: { width: 3, flex: 1, minHeight: 22, borderRadius: 2 },
  textCol: { flex: 1, paddingLeft: spacing.md, paddingBottom: spacing.lg, paddingTop: 2 },
  now: { marginTop: 2 },
});
