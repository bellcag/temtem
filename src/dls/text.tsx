import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Core/Text — Storybook `size` scale. */
export type TextSize =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "subheading"
  | "body-lg"
  | "body-sm"
  | "small"
  | "x-small"
  | "xx-small";

const SIZE: Record<TextSize, string> = {
  h1: "text-[48px] leading-[58px] font-black text-black",
  h2: "text-[36px] leading-[42px] font-black text-black",
  h3: "text-[32px] leading-[40px] font-bold text-black",
  h4: "text-[28px] leading-[36px] font-bold text-black",
  h5: "text-h5 font-black text-black",
  h6: "text-h6 font-bold text-black",
  subheading: "text-subheading font-bold text-black",
  "body-lg": "text-body-l font-normal text-black",
  "body-sm": "text-body-s font-normal text-black",
  small: "text-small font-normal text-grey-700",
  "x-small": "text-xsmall font-normal text-grey-700",
  "xx-small": "text-xxsmall font-bold uppercase tracking-[0.06em] text-grey-500",
};

type Props = HTMLAttributes<HTMLElement> & {
  as?: "p" | "span" | "div" | "h1" | "h2" | "h3" | "h6" | "label";
  size?: TextSize;
};

export function Text({
  as: Tag = "p",
  size = "body-sm",
  className,
  ...props
}: Props) {
  return <Tag className={cn(SIZE[size], className)} {...props} />;
}
