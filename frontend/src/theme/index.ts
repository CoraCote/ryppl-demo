// RYPPL design tokens — sourced from /app/design_guidelines.json
// Tactile / Playful personality: navy + vibrant yellow, chunky cards, pill buttons.

export const colors = {
  surface: "#FFFFFF",
  onSurface: "#0F172A",
  surfaceSecondary: "#F8FAFC",
  onSurfaceSecondary: "#334155",
  surfaceTertiary: "#F1F5F9",
  onSurfaceTertiary: "#475569",
  surfaceInverse: "#0F172A",
  onSurfaceInverse: "#FFFFFF",

  brand: "#0A2342", // deep navy
  brandPrimary: "#FFD600", // vibrant yellow
  onBrandPrimary: "#0A2342",
  brandSecondary: "#0A2342",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#FFF4B3",
  onBrandTertiary: "#0A2342",

  success: "#10B981",
  onSuccess: "#FFFFFF",
  warning: "#F59E0B",
  onWarning: "#FFFFFF",
  error: "#EF4444",
  onError: "#FFFFFF",
  info: "#3B82F6",
  onInfo: "#FFFFFF",

  // Map status pins (per product brief)
  pinGreen: "#10B981",
  pinRed: "#EF4444",
  pinBlue: "#3B82F6",
  pinGray: "#94A3B8",

  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  divider: "#F1F5F9",

  muted: "#64748B",
  overlay: "rgba(10,35,66,0.45)",
};

export const font = {
  regular: "PlusJakartaSans-Regular",
  medium: "PlusJakartaSans-Medium",
  semibold: "PlusJakartaSans-SemiBold",
  bold: "PlusJakartaSans-Bold",
  extrabold: "PlusJakartaSans-ExtraBold",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 999,
};

export const fontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 30,
};

export const shadow = {
  card: {
    shadowColor: "#0A2342",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  soft: {
    shadowColor: "#0A2342",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  floating: {
    shadowColor: "#0A2342",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const STATUS_META: Record<
  string,
  { label: string; color: string; step: number }
> = {
  incoming: { label: "Order Placed", color: colors.info, step: 0 },
  claimed_packer: { label: "Claimed by Packer", color: colors.info, step: 1 },
  packing: { label: "Packing", color: colors.warning, step: 2 },
  ready: { label: "Ready for Pickup", color: colors.warning, step: 3 },
  claimed_runner: { label: "Runner Assigned", color: colors.info, step: 4 },
  in_bag: { label: "In the Bag", color: colors.info, step: 5 },
  on_road: { label: "On the Way", color: colors.brandPrimary, step: 6 },
  complete: { label: "Delivered", color: colors.success, step: 7 },
};

export const TIMELINE_STEPS = [
  "incoming",
  "claimed_packer",
  "packing",
  "ready",
  "claimed_runner",
  "in_bag",
  "on_road",
  "complete",
];
