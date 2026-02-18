import { Text, View, TextInput, TouchableOpacity, Modal as RNModal, StyleSheet, Platform, ActivityIndicator } from "react-native";
import { ReactNode } from "react";
import { useColors } from "@/hooks/use-colors";
import { Typography, Spacing, Radius, Shadows } from "@/constants/design-tokens";
import * as Haptics from "expo-haptics";

// ─── Button ─────────────────────────────────────────────────
type ButtonVariant = "primary" | "secondary" | "ghost" | "accent" | "danger" | "outline";
export type { ButtonVariant };
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  style?: any;
}

export function Button({ title, onPress, variant = "primary", size = "md", disabled = false, loading = false, icon, fullWidth = false, style: extraStyle }: ButtonProps) {
  const colors = useColors();

  const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
    primary:   { bg: colors.primary, text: "#FFFFFF" },
    secondary: { bg: "transparent", text: colors.primary, border: colors.primary },
    ghost:     { bg: "transparent", text: colors.muted },
    accent:    { bg: (colors as any).accent || "#C9963B", text: "#FFFFFF" },
    danger:    { bg: colors.error, text: "#FFFFFF" },
    outline:   { bg: "transparent", text: colors.error, border: colors.error },
  };

  const sizeStyles: Record<ButtonSize, { h: number; px: number; fontSize: number }> = {
    sm: { h: 36, px: 14, fontSize: 13 },
    md: { h: 44, px: 20, fontSize: 15 },
    lg: { h: 52, px: 24, fontSize: 17 },
  };

  const v = variantStyles[variant];
  const s = sizeStyles[size];

  const handlePress = () => {
    if (disabled || loading) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[
        {
          height: s.h,
          paddingHorizontal: s.px,
          backgroundColor: v.bg,
          borderRadius: Radius.lg,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          ...(v.border ? { borderWidth: 1.5, borderColor: v.border } : {}),
          ...(disabled ? { opacity: 0.5 } : {}),
          ...(fullWidth ? { width: "100%" as any } : {}),
        },
        extraStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <>
          {icon}
          <Text style={{ color: v.text, fontSize: s.fontSize, fontWeight: "700" }}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Input ──────────────────────────────────────────────────
interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad" | "decimal-pad";
  secureTextEntry?: boolean;
  error?: string;
  helper?: string;
  required?: boolean;
  mono?: boolean;
  editable?: boolean;
  returnKeyType?: "done" | "next" | "go" | "search";
  onSubmitEditing?: () => void;
}

export function Input({ label, placeholder, value, onChangeText, multiline = false, numberOfLines = 1, keyboardType = "default", secureTextEntry = false, error, helper, required = false, mono = false, editable = true, returnKeyType, onSubmitEditing }: InputProps) {
  const colors = useColors();
  const surfaceAlt = (colors as any).surfaceAlt || colors.surface;

  return (
    <View style={{ gap: Spacing.xs }}>
      {label && (
        <View style={{ flexDirection: "row", gap: 2 }}>
          <Text style={[Typography.labelMd, { color: colors.foreground }]}>{label}</Text>
          {required && <Text style={{ color: colors.error, fontSize: 13 }}>*</Text>}
        </View>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        editable={editable}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        style={[
          {
            backgroundColor: surfaceAlt,
            borderWidth: 1,
            borderColor: error ? colors.error : colors.border,
            borderRadius: Radius.md,
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.md,
            color: colors.foreground,
            fontSize: 15,
            lineHeight: 21,
            ...(mono ? Typography.mono : {}),
            ...(multiline ? { minHeight: numberOfLines * 24 + 24, textAlignVertical: "top" as const } : {}),
          },
        ]}
      />
      {error && <Text style={[Typography.caption, { color: colors.error }]}>{error}</Text>}
      {helper && !error && <Text style={[Typography.caption, { color: colors.muted }]}>{helper}</Text>}
    </View>
  );
}

// ─── Card ───────────────────────────────────────────────────
interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: any;
  noPadding?: boolean;
}

export function Card({ children, onPress, style, noPadding = false }: CardProps) {
  const colors = useColors();
  const cardStyle = [
    {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...Shadows.sm,
      ...(noPadding ? {} : { padding: Spacing.lg }),
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

// ─── Modal ──────────────────────────────────────────────────
interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ visible, onClose, title, children, footer }: ModalProps) {
  const colors = useColors();

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={[modalStyles.content, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {title && (
            <View style={modalStyles.header}>
              <Text style={[Typography.h1, { color: colors.foreground }]}>{title}</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <Text style={{ fontSize: 20, color: colors.muted }}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={modalStyles.body}>{children}</View>
          {footer && <View style={[modalStyles.footer, { borderTopColor: colors.border }]}>{footer}</View>}
        </View>
      </View>
    </RNModal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  content: { width: "100%", maxWidth: 420, borderRadius: 20, borderWidth: 1, maxHeight: "80%" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingBottom: 12 },
  body: { paddingHorizontal: 20, paddingBottom: 20 },
  footer: { borderTopWidth: 1, padding: 16, flexDirection: "row", justifyContent: "flex-end", gap: 12 },
});

// ─── Stepper ────────────────────────────────────────────────
interface StepperProps {
  steps: string[];
  currentStep: number;
  onStepPress?: (step: number) => void;
}

export function Stepper({ steps, currentStep, onStepPress }: StepperProps) {
  const colors = useColors();
  const accent = (colors as any).accent || "#C9963B";

  return (
    <View style={stepperStyles.container}>
      {steps.map((label, i) => {
        const isActive = i === currentStep;
        const isCompleted = i < currentStep;
        const dotColor = isCompleted ? colors.success : isActive ? accent : colors.border;
        const textColor = isActive ? colors.foreground : isCompleted ? colors.success : colors.muted;

        return (
          <TouchableOpacity
            key={i}
            onPress={() => onStepPress?.(i)}
            disabled={!onStepPress || i > currentStep}
            activeOpacity={0.7}
            style={stepperStyles.step}
          >
            <View style={[stepperStyles.dot, { backgroundColor: dotColor }]}>
              {isCompleted ? (
                <Text style={stepperStyles.check}>✓</Text>
              ) : (
                <Text style={[stepperStyles.number, isActive && { color: "#fff" }]}>{i + 1}</Text>
              )}
            </View>
            <Text style={[Typography.caption, { color: textColor, textAlign: "center" }]} numberOfLines={1}>{label}</Text>
            {i < steps.length - 1 && (
              <View style={[stepperStyles.line, { backgroundColor: isCompleted ? colors.success : colors.border }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 4 },
  step: { flex: 1, alignItems: "center", gap: 4, position: "relative" },
  dot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  number: { fontSize: 12, fontWeight: "700", color: "#666" },
  check: { fontSize: 14, fontWeight: "800", color: "#fff" },
  line: { position: "absolute", top: 14, left: "60%", right: "-40%", height: 2 },
});

// ─── Section Header ─────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  const colors = useColors();

  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: Spacing.sm }}>
      <View style={{ flex: 1 }}>
        <Text style={[Typography.h2, { color: colors.foreground }]}>{title}</Text>
        {subtitle && <Text style={[Typography.bodySm, { color: colors.muted, marginTop: 2 }]}>{subtitle}</Text>}
      </View>
      {action && (
        <TouchableOpacity onPress={action.onPress} activeOpacity={0.7}>
          <Text style={[Typography.labelMd, { color: colors.primary }]}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Chip / Tag ─────────────────────────────────────────────
interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  size?: "sm" | "md";
}

export function Chip({ label, selected = false, onPress, color, size = "md" }: ChipProps) {
  const colors = useColors();
  const accent = color || (colors as any).accent || "#C9963B";
  const h = size === "sm" ? 28 : 34;
  const px = size === "sm" ? 10 : 14;
  const fs = size === "sm" ? 11 : 13;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
      style={{
        height: h,
        paddingHorizontal: px,
        borderRadius: h / 2,
        backgroundColor: selected ? accent + "18" : colors.surface,
        borderWidth: 1,
        borderColor: selected ? accent : colors.border,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: fs, fontWeight: selected ? "700" : "500", color: selected ? accent : colors.muted }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Divider ────────────────────────────────────────────────
export function Divider({ spacing = Spacing.lg }: { spacing?: number }) {
  const colors = useColors();
  return <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing }} />;
}
