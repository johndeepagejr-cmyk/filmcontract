// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chart.bar": "bar-chart",
  "chart.bar.fill": "bar-chart",
  "person.fill": "person",
  "magnifyingglass": "search",
  // Video audition icons
  "video": "videocam",
  "video.fill": "videocam",
  "video.slash": "videocam-off",
  "clock": "schedule",
  "timer": "timer",
  "record.circle": "fiber-manual-record",
  "plus": "add",
  "plus.circle.fill": "add-circle",
  "bell": "notifications",
  "phone.down.fill": "call-end",
  "xmark": "close",
  "exclamationmark.triangle": "warning",
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "stop.fill": "stop",
  // Messaging icons
  "message.fill": "chat",
  "message": "chat-bubble-outline",
  "bubble.left.fill": "chat-bubble",
  "phone.fill": "phone",
  "arrow.left": "arrow-back",
  // Navigation tabs
  "doc.text.fill": "description",
  "person.2.fill": "people",
  "network": "hub",
  // Casting & content
  "film": "movie",
  "star.fill": "star",
  "star": "star-border",
  "bookmark.fill": "bookmark",
  "bookmark": "bookmark-border",
  "location.fill": "location-on",
  "location": "location-on",
  "calendar": "event",
  "dollarsign.circle": "attach-money",
  "slider.horizontal.3": "tune",
  "camera.fill": "photo-camera",
  "photo.fill": "photo",
  "checkmark.circle.fill": "check-circle",
  "checkmark": "check",
  "trash": "delete",
  "pencil": "edit",
  "arrow.up.circle.fill": "upload",
  "arrow.right": "arrow-forward",
  "info.circle": "info",
  "person.crop.rectangle": "badge",
  "theatermasks.fill": "theater-comedy",
  "gearshape.fill": "settings",
  "megaphone.fill": "campaign",
  "doc.on.doc.fill": "file-copy",
  "xmark.circle.fill": "cancel",
  "square.and.arrow.up": "share",
  "ellipsis": "more-horiz",
  "hand.thumbsup.fill": "thumb-up",
  "hand.thumbsdown.fill": "thumb-down",
  "eye.fill": "visibility",
  "flag.fill": "flag",
  "bolt.fill": "flash-on",
  "sparkles": "auto-awesome",
  "arrow.up.arrow.down": "swap-vert",
  "clock.fill": "schedule",
  "envelope.fill": "email",
  "arrow.counterclockwise": "refresh",
  // Self-tape recorder icons
  "flashlight.on.fill": "flash-on",
  "flashlight.off.fill": "flash-off",
  "arrow.triangle.2.circlepath.camera": "flip-camera-ios",
  "grid": "grid-on",
  "grid.circle": "grid-on",
  "waveform": "graphic-eq",
  "mic.fill": "mic",
  "mic.slash.fill": "mic-off",
  "text.alignleft": "format-align-left",
  "scissors": "content-cut",
  "wand.and.stars": "auto-fix-high",
  "square.and.arrow.down": "download",
  "arrow.uturn.backward": "undo",
  "arrow.uturn.forward": "redo",
  "photo": "photo",
  "doc.fill": "insert-drive-file",
  "slider.horizontal.below.rectangle": "tune",
  "aspectratio": "aspect-ratio",
  "speedometer": "speed",
  "circle.fill": "circle",
  "checkmark.seal.fill": "verified",
  "tray.fill": "inbox",
  "arrow.down.circle.fill": "download",
  "rectangle.split.3x1": "view-column",
  "person.3.fill": "groups",
  "text.bubble.fill": "rate-review",
  "chart.line.uptrend.xyaxis": "trending-up",
  "pause.circle.fill": "pause-circle-filled",
  "play.circle.fill": "play-circle-filled",
  "forward.fill": "fast-forward",
  "backward.fill": "fast-rewind",
  "speaker.wave.2.fill": "volume-up",
  "speaker.slash.fill": "volume-off",
  "pip": "picture-in-picture",
  "questionmark.circle": "help-outline",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
