export function ImagePlaceholder({ label, tone = "ocean", className = "" }: { label: string; tone?: string; className?: string }) {
  return (
    <div className={`image-placeholder tone-${tone} ${className}`} role="img" aria-label={`${label} image placeholder`}>
      <div className="placeholder-mark"><span>IMAGE</span><strong>{label}</strong></div>
    </div>
  );
}

