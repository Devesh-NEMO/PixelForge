export function SiteFooter() {
  return (
    <footer className="border-t-2 border-ink bg-paper">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col items-start justify-center gap-1 px-5 py-3.5 text-[9.5px] tracking-[0.12em] text-muted uppercase sm:h-[68px] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-10 sm:py-0">
        <span>PixelForge — Convert, edit and enjoy your images</span>
        <span className="flex gap-5">
          <span>v1.0</span>
          <span>No uploads</span>
        </span>
      </div>
    </footer>
  );
}
