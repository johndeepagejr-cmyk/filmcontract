import { type ReactNode } from "react";
import Animated, { FadeInUp, FadeInDown, SlideInRight, type AnimatedProps } from "react-native-reanimated";
import { type ViewProps } from "react-native";

interface Props {
  children: ReactNode;
  index: number;
  direction?: "up" | "down" | "right";
  delay?: number;
}

export function AnimatedListItem({ children, index, direction = "up", delay = 50 }: Props) {
  const enterDelay = index * delay;

  const entering = direction === "up"
    ? FadeInUp.delay(enterDelay).duration(300).springify().damping(18)
    : direction === "down"
    ? FadeInDown.delay(enterDelay).duration(300).springify().damping(18)
    : SlideInRight.delay(enterDelay).duration(300).springify().damping(18);

  return (
    <Animated.View entering={entering}>
      {children}
    </Animated.View>
  );
}
