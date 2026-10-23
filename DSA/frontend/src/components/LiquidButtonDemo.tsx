import { LiquidButton } from "@/components/animate-ui/buttons/liquid"

export default function LiquidButtonDemo({
  delay = 0.3,
  fillHeight = 3,
  tapScale = 0.97,
}: {
  delay?: number
  fillHeight?: number
  tapScale?: number
}) {
  return (
    <LiquidButton
      delay={`${delay}s`}
      fillHeight={`${fillHeight}px`}
      tapScale={tapScale}
    >
      Liquid Button
    </LiquidButton>
  )
}

export { LiquidButtonDemo }
