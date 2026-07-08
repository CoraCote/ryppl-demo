import React, { useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/api/client";
import { useAuth, User } from "@/src/context/AuthContext";
import { colors, font, radius, spacing } from "@/src/theme";
import { Txt } from "@/src/components/Txt";
import { Button } from "@/src/components/Button";

export default function Verify() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const { phone, name } = useLocalSearchParams<{ phone: string; name?: string }>();
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const verify = async () => {
    if (code.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      const res = await api<{ access_token: string; user: User }>("/auth/verify-otp", {
        method: "POST",
        auth: false,
        body: { phone, otp: code, name: name || undefined },
      });
      await login(res.access_token, res.user);
      if (res.user.role === "employee") {
        router.replace("/(employee)");
      } else {
        router.replace("/(customer)");
      }
    } catch (e: any) {
      setError(e.message || "Invalid code");
      setLoading(false);
    }
  };

  const digits = code.padEnd(6, " ").split("");

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} testID="verify-back">
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.iconBadge}>
          <Ionicons name="chatbubble-ellipses" size={28} color={colors.brand} />
        </View>
        <Txt variant="title">Verify your number</Txt>
        <Txt variant="bodyMuted" style={styles.sub}>
          We sent a 6-digit code to{"\n"}
          <Txt variant="subtitle">{phone}</Txt>
        </Txt>

        <Pressable style={styles.boxes} onPress={() => inputRef.current?.focus()}>
          {digits.map((d, i) => {
            const active = i === code.length;
            return (
              <View
                key={i}
                style={[styles.box, active && styles.boxActive, d.trim() && styles.boxFilled]}
              >
                <Txt variant="title">{d.trim()}</Txt>
              </View>
            );
          })}
        </Pressable>

        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          autoFocus
          maxLength={6}
          style={styles.hiddenInput}
          testID="otp-input"
        />

        <View style={styles.hint}>
          <Ionicons name="sparkles-outline" size={15} color={colors.warning} />
          <Txt variant="caption" style={styles.hintTxt}>
            Demo mode — any 6-digit code works.
          </Txt>
        </View>

        {error ? (
          <Txt variant="caption" color={colors.error} style={styles.error}>
            {error}
          </Txt>
        ) : null}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          title="Verify & Continue"
          disabled={code.length !== 6}
          loading={loading}
          onPress={verify}
          testID="verify-button"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  body: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  sub: { marginTop: spacing.xs, lineHeight: 22 },
  boxes: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xxl },
  box: {
    flex: 1,
    aspectRatio: 0.85,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  boxActive: { borderColor: colors.brand, backgroundColor: colors.surface },
  boxFilled: { borderColor: colors.brand, backgroundColor: colors.brandTertiary },
  hiddenInput: { position: "absolute", opacity: 0, height: 1, width: 1 },
  hint: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.xl },
  hintTxt: { color: colors.warning, fontFamily: font.semibold },
  error: { marginTop: spacing.md },
  footer: { paddingHorizontal: spacing.xl },
});
