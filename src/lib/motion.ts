export const motionTimings = {
  fast: { duration: 0.12 },
  normal: { duration: 0.18, ease: "easeOut" as const },
  layout: { type: "spring" as const, stiffness: 420, damping: 32 },
};
