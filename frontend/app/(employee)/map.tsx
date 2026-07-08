import React, { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";
import { colors, radius, shadow, spacing } from "@/src/theme";
import { money } from "@/src/lib/format";
import { Txt } from "@/src/components/Txt";
import { Button } from "@/src/components/Button";
import { StatusBadge } from "@/src/components/StatusBadge";
import { CampusMap, MapPin } from "@/src/components/CampusMap";

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const sheetRef = useRef<BottomSheet>(null);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [selected, setSelected] = useState<MapPin | null>(null);
  const [claiming, setClaiming] = useState(false);

  const snapPoints = useMemo(() => [280], []);

  const load = useCallback(async () => {
    try {
      const data = await api<MapPin[]>("/employee/map");
      setPins(data);
      setSelected((prev) => (prev ? data.find((p) => p.id === prev.id) ?? prev : prev));
    } catch {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      const t = setInterval(load, 5000);
      return () => clearInterval(t);
    }, [load]),
  );

  const onPressPin = (pin: MapPin) => {
    setSelected(pin);
    sheetRef.current?.expand();
  };

  const claim = async (asRole: "packer" | "runner") => {
    if (!selected) return;
    setClaiming(true);
    try {
      await api(`/orders/${selected.id}/claim`, { method: "POST", body: { as_role: asRole } });
      sheetRef.current?.close();
      router.push(`/delivery/${selected.id}`);
    } catch {
      load();
    } finally {
      setClaiming(false);
    }
  };

  const renderCTA = () => {
    if (!selected) return null;
    if (selected.pin === "green") {
      return <Button title="Claim (Packer)" variant="success" icon="cube" loading={claiming} onPress={() => claim("packer")} testID="sheet-claim-packer" />;
    }
    if (selected.pin === "red") {
      return <Button title="Claim (Runner)" variant="danger" icon="bicycle" loading={claiming} onPress={() => claim("runner")} testID="sheet-claim-runner" />;
    }
    return (
      <Button
        title="Continue Delivery"
        variant="secondary"
        icon="arrow-forward"
        onPress={() => {
          sheetRef.current?.close();
          router.push(`/delivery/${selected.id}`);
        }}
        testID="sheet-continue"
      />
    );
  };

  return (
    <View style={styles.container}>
      <CampusMap pins={pins} onPressPin={onPressPin} />

      <View style={[styles.header, { top: insets.top + spacing.sm }]}>
        <View style={styles.titleWrap}>
          <Txt variant="subtitle" color={colors.brand}>
            Campus Map
          </Txt>
          <Txt variant="caption">{pins.length} active orders</Txt>
        </View>
      </View>

      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
        )}
        handleIndicatorStyle={{ backgroundColor: colors.borderStrong }}
      >
        <BottomSheetView style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          {selected ? (
            <>
              <View style={styles.sheetTop}>
                <View>
                  <Txt variant="heading">{selected.order_number}</Txt>
                  <StatusBadge status={selected.status} />
                </View>
                <View style={styles.totalPill}>
                  <Txt variant="caption" color={colors.muted}>
                    Total
                  </Txt>
                  <Txt variant="heading" color={colors.brand}>
                    {money(selected.total)}
                  </Txt>
                </View>
              </View>

              <View style={styles.sheetRow}>
                <Ionicons name="location-outline" size={18} color={colors.muted} />
                <Txt variant="body" style={styles.sheetRowTxt}>
                  {selected.address.building} · Room {selected.address.room}
                </Txt>
              </View>
              <View style={styles.sheetRow}>
                <Ionicons name="cube-outline" size={18} color={colors.muted} />
                <Txt variant="body" style={styles.sheetRowTxt}>
                  {selected.item_count} items to fulfill
                </Txt>
              </View>

              <View style={styles.sheetCta}>{renderCTA()}</View>
            </>
          ) : null}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  header: { position: "absolute", left: spacing.lg, right: spacing.lg, flexDirection: "row" },
  titleWrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadow.soft,
  },
  sheet: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  sheetTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  totalPill: { alignItems: "flex-end" },
  sheetRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md, gap: spacing.sm },
  sheetRowTxt: { flex: 1 },
  sheetCta: { marginTop: spacing.sm },
});
