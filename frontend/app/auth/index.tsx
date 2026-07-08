import React, { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/api/client";
import { colors, font, radius, spacing } from "@/src/theme";
import { Txt } from "@/src/components/Txt";
import { Button } from "@/src/components/Button";

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const valid = phone.replace(/\D/g, "").length >= 10;

  const sendOtp = async () => {
    if (!valid) return;
    setError("");
    setLoading(true);
    try {
      const normalized = phone.startsWith("+") ? phone : `+1${phone.replace(/\D/g, "")}`;
      await api("/auth/send-otp", { method: "POST", body: { phone: normalized }, auth: false });
      router.push({
        pathname: "/auth/verify",
        params: { phone: normalized, name: name.trim() },
      });
    } catch (e: any) {
      setError(e.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.flex}>
      <LinearGradient colors={[colors.brand, "#0d2d54"]} style={styles.hero}>
        <View style={[styles.heroInner, { paddingTop: insets.top + spacing.xxl }]}>
          <View style={styles.logoBadge}>
            <Ionicons name="fast-food" size={30} color={colors.brand} />
          </View>
          <Txt variant="display" color={colors.brandPrimary} style={styles.logo}>
            RYPPL
          </Txt>
          <Txt variant="subtitle" color="#CBD5E1">
            Campus snacks & groceries,{"\n"}delivered in minutes.
          </Txt>
        </View>
      </LinearGradient>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Txt variant="title">Welcome 👋</Txt>
        <Txt variant="bodyMuted" style={styles.sub}>
          Enter your phone number to sign in or create an account.
        </Txt>

        <Txt variant="label" style={styles.fieldLabel}>
          YOUR NAME (optional)
        </Txt>
        <View style={styles.inputWrap}>
          <Ionicons name="person-outline" size={20} color={colors.muted} />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Jordan"
            placeholderTextColor={colors.muted}
            style={styles.input}
            testID="name-input"
          />
        </View>

        <Txt variant="label" style={styles.fieldLabel}>
          PHONE NUMBER
        </Txt>
        <View style={styles.inputWrap}>
          <Ionicons name="call-outline" size={20} color={colors.muted} />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="(555) 123-4567"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
            style={styles.input}
            testID="phone-input"
          />
        </View>

        {error ? (
          <Txt variant="caption" color={colors.error} style={styles.error}>
            {error}
          </Txt>
        ) : null}

        <View style={styles.cta}>
          <Button
            title="Send Code"
            icon="arrow-forward"
            disabled={!valid}
            loading={loading}
            onPress={sendOtp}
            testID="send-otp-button"
          />
        </View>

        <View style={styles.hintBox}>
          <Ionicons name="information-circle-outline" size={16} color={colors.muted} />
          <Txt variant="caption" style={styles.hintTxt}>
            Employee demo: +1 555 000 0001 (Packer) · +1 555 000 0002 (Runner)
          </Txt>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface },
  hero: { flex: 1 },
  heroInner: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: "center" },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  logo: { letterSpacing: 2 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  sub: { marginTop: spacing.xs },
  fieldLabel: { marginTop: spacing.lg, marginBottom: spacing.sm },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    height: 54,
    marginLeft: spacing.sm,
    fontFamily: font.medium,
    fontSize: 16,
    color: colors.onSurface,
  },
  error: { marginTop: spacing.sm },
  cta: { marginTop: spacing.xl },
  hintBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.lg,
    gap: 6,
  },
  hintTxt: { flex: 1 },
});
