import { Lock } from "lucide-react";
import { ImageConverter } from "../components/image-converter";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";

export default function Home() {
  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden">
      {/* Ambient corner light */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[10px] -right-[155px] -z-10 h-[240px] w-[240px] rounded-full bg-[#5550fe]/[0.28] blur-[50px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[12px] left-[-110px] -z-10 h-[190px] w-[190px] rounded-full bg-[#5550fe]/[0.42] blur-[38px]"
      />
      <SiteHeader />

      <main className="flex flex-1 flex-col items-center px-5 pt-[46px] pb-[80px] sm:px-8 sm:pt-[63px] sm:pb-[96px]">
        <section className="w-full max-w-[952px] text-center">
          <h1 className="text-[38px] leading-[1.06] font-extrabold tracking-[-0.02em] text-ink sm:text-[50px] lg:text-[62px]">
            Convert images <span className="text-gradient">in seconds.</span>
          </h1>
          <p className="mx-auto mt-[14px] max-w-[620px] sm:mt-[18px] text-[17px] font-medium text-muted sm:text-[22px] lg:text-[24px]">
            Your images, your format. Simple, fast, and secure.
          </p>
        </section>

        <div className="mt-[36px] w-full max-w-[952px] sm:mt-[52px]">
          <ImageConverter />
        </div>

        <p className="mt-[26px] flex items-center gap-2.5 text-[15px] font-medium text-[#bfd8f8] sm:mt-[33px] sm:text-[17px]">
          <Lock size={25} className="text-periwinkle" strokeWidth={1.8} />
          Your files stay on your device
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
