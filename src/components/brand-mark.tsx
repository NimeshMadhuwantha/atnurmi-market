import Image from "next/image";

type BrandMarkProps = {
  className?: string;
  priority?: boolean;
  size?: number;
};

export function BrandMark({ className = "", priority = false, size = 36 }: BrandMarkProps) {
  return (
    <Image
      aria-hidden="true"
      className={`brand-mark ${className}`.trim()}
      src="/icon.svg"
      alt=""
      width={size}
      height={size}
      priority={priority}
      unoptimized
    />
  );
}
