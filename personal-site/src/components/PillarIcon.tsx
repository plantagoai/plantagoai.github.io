import { AudioLines, Wallet, ShoppingCart } from "lucide-react";
import type { PillarKey } from "../data/cv";

const ICONS = { voice: AudioLines, share: Wallet, market: ShoppingCart } as const;

export default function PillarIcon({
  pillar,
  size = 24,
  className,
}: {
  pillar: PillarKey;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[pillar];
  return (
    <Icon
      size={size}
      strokeWidth={2.2}
      className={className}
      style={{ color: `hsl(var(--pillar-${pillar}))` }}
    />
  );
}
