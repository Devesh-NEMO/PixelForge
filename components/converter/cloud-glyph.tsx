export function CloudGlyph() {
  return (
    <svg
      viewBox="0.25 2.15 22.5 19.6"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden
      className="h-[52px] w-[72px] drop-shadow-[0_0_22px_rgba(124,99,255,0.4)] sm:h-[67px] sm:w-[89px]"
      stroke="url(#cloud-upload-gradient)"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient
          id="cloud-upload-gradient"
          x1="12"
          y1="3"
          x2="12"
          y2="21"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#b55cf7" />
          <stop offset="0.55" stopColor="#8b5bfc" />
          <stop offset="1" stopColor="#5a63fe" />
        </linearGradient>
      </defs>
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M12 21v-8" />
      <path d="m8.5 16.5 3.5-3.5 3.5 3.5" />
    </svg>
  );
}
