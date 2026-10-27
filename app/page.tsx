import { ImageConverter } from "../components/image-converter";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";

export default function Home() {
  return (
    <div className="grid-paper flex min-h-screen flex-col bg-paper">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col justify-center px-5 py-9 sm:px-10 sm:py-12">
        <section>
          <span className="inline-flex items-center gap-2 border-[1.5px] border-ink bg-paper-2 px-2.5 py-1.5 text-[9.5px] tracking-[0.14em] uppercase sm:text-[10px]">
            <span className="h-[7px] w-[7px] border-[1.5px] border-ink bg-lime" />
            100% local — no uploads
          </span>

          <h1 className="mt-6 font-display text-[32px] leading-[0.9] tracking-[-0.035em] uppercase sm:mt-8 sm:text-[62px] lg:text-[84px]">
            Convert images
            <br />
            in <span className="mark">seconds.</span>
          </h1>

          <p className="mt-5 max-w-[540px] text-[11.5px] leading-relaxed text-muted sm:mt-7 sm:text-[13px]">
            Your images, your format. Drop a file, pick an output, download it.
            Nothing leaves this machine — not even a request.
          </p>
        </section>

        <div className="mt-8 sm:mt-10">
          <ImageConverter />
        </div>

        <p className="mt-5 mb-8 flex items-center gap-2 text-[10px] tracking-[0.12em] text-muted uppercase sm:text-[10.5px]">
          <span className="h-[9px] w-[9px] border-[1.5px] border-ink bg-lime" />
          Files never leave your device
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
