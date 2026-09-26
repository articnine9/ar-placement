import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import HeroViewer from "@/components/jewelry/HeroViewer";
import { PRODUCTS } from "@/lib/products";

export const metadata: Metadata = {
  title: "D. Harris Nadar — Diamonds & Jewellery",
  description:
    "Explore the V-Fringe Diamond Necklace in 360° 3D and try it on live with your phone camera.",
};

const LOGO = "/brand/dharris-nadar-logo.png";
const PRODUCT_PHOTO = "/brand/v-fringe-necklace.png";

function GoldDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-hidden>
      <span className="h-px w-12 bg-brand-gold/70" />
      <span className="h-2 w-2 rotate-45 border border-brand-gold" />
      <span className="h-px w-12 bg-brand-gold/70" />
    </div>
  );
}

const DETAILS = [
  {
    title: "Diamond Pavé",
    body: "Rows of tiny diamonds are set along the collar and across every drop, so the whole piece sparkles from any angle.",
    icon: (
      <path d="M12 3l7 7-7 11L5 10l7-7zM5 10h14M9.5 10L12 21l2.5-11M9 3.8L9.5 10M15 3.8L14.5 10" />
    ),
  },
  {
    title: "Graduated Fringe",
    body: "Slender gold rods lengthen toward the centre, each finished with a rhombus drop, drawing the eye into a soft V.",
    icon: <path d="M4 5c4 6 12 6 16 0M7 8v6M10 9.5v9M12 10v11M14 9.5v9M17 8v6" />,
  },
  {
    title: "Sculpted Gold Collar",
    body: "Polished gold bars interrupt the pavé line, giving the collar structure so it sits cleanly on the neckline.",
    icon: <path d="M3 6c3 9 15 9 18 0M6.5 9.5l2 1.3M15.5 10.8l2-1.3" />,
  },
];

const TRY_ON_STEPS = [
  { title: "Tap “Try It On”", body: "Open this page on your phone and start the virtual try-on." },
  { title: "Allow the front camera", body: "Face tracking runs on your device — nothing is uploaded or recorded." },
  { title: "Move naturally", body: "Turn your head and the necklace follows, so you can see how it sits on you." },
];

export default function Home() {
  const demoProducts = PRODUCTS.filter((p) => p.id !== "necklace");

  return (
    <div className="flex flex-1 flex-col bg-brand-cream font-body text-brand-ink">
      <div className="bg-brand-ink py-2 text-center text-[10px] uppercase tracking-[0.3em] text-brand-gold-light sm:text-[11px]">
        Now with live virtual try-on
      </div>

      <header className="sticky top-0 z-30 border-b border-brand-gold/25 bg-brand-cream/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:h-20 md:px-6">
          <Link href="/" aria-label="D. Harris Nadar Diamonds & Jewellery — home">
            <Image
              src={LOGO}
              alt="D. Harris Nadar Diamonds & Jewellery"
              width={300}
              height={87}
              loading="eager"
              fetchPriority="high"
              className="h-10 w-auto md:h-12"
            />
          </Link>
          <nav className="hidden items-center gap-10 text-[11px] uppercase tracking-[0.25em] whitespace-nowrap text-brand-muted md:flex">
            <a href="#collection" className="transition-colors hover:text-brand-gold-deep">Collection</a>
            <a href="#details" className="transition-colors hover:text-brand-gold-deep">Craftsmanship</a>
            <a href="#try-on" className="transition-colors hover:text-brand-gold-deep">Virtual Try-On</a>
          </nav>
          <Link
            href="/ar/necklace"
            className="rounded-full border border-brand-gold px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-brand-gold-deep transition-colors hover:bg-brand-gold hover:text-brand-ink"
          >
            Try On
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section id="collection" className="relative overflow-hidden">
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_62%_45%,#ffffff_0%,#f4f2ee_40%,#e6e2dc_100%)]"
            aria-hidden
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-4 px-4 pb-14 pt-6 md:grid-cols-2 md:gap-8 md:px-6 md:py-16">
            <div className="relative order-1 h-[58vh] min-h-[380px] md:order-2 md:h-[620px]">
              <HeroViewer />
              <p className="pointer-events-none absolute inset-x-0 bottom-1 text-center text-[10px] uppercase tracking-[0.3em] text-brand-muted">
                Drag to rotate · 360° view
              </p>
            </div>

            <div className="order-2 text-center md:order-1 md:text-left">
              <p className="text-[11px] uppercase tracking-[0.35em] text-brand-gold-deep">Signature Collection</p>
              <h1 className="mt-4 font-display text-[2.6rem] font-medium leading-[1.05] sm:text-5xl md:text-6xl">
                The V-Fringe
                <br />
                <em className="font-normal text-brand-gold-deep">Diamond</em> Necklace
              </h1>
              <GoldDivider className="my-6 justify-center md:justify-start" />
              <p className="mx-auto max-w-md text-[15px] leading-7 text-brand-muted md:mx-0">
                Graduated fringe drops of diamond pavé fall from a sculpted gold collar — a piece designed to frame
                the neckline and catch the light with every movement.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
                <Link
                  href="/ar/necklace"
                  className="flex h-14 w-full max-w-xs items-center justify-center rounded-full bg-brand-gold px-8 text-xs font-medium uppercase tracking-[0.25em] whitespace-nowrap text-brand-ink shadow-[0_10px_30px_-12px_rgba(138,106,47,0.7)] transition-colors hover:bg-brand-gold-light sm:w-auto"
                >
                  Try It On
                </Link>
                <a
                  href="#details"
                  className="flex h-14 w-full max-w-xs items-center justify-center rounded-full border border-brand-ink/20 px-8 text-xs font-medium uppercase tracking-[0.25em] whitespace-nowrap text-brand-ink transition-colors hover:border-brand-gold sm:w-auto"
                >
                  Discover Details
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Details */}
        <section id="details" className="bg-white py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-[0.35em] text-brand-gold-deep">Craftsmanship</p>
              <h2 className="mt-3 font-display text-4xl font-medium md:text-5xl">The Art of the Details</h2>
              <GoldDivider className="mt-6 justify-center" />
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {DETAILS.map((d) => (
                <div key={d.title} className="border border-brand-gold/25 bg-brand-cream px-6 py-8 text-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="mx-auto h-10 w-10 text-brand-gold"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    {d.icon}
                  </svg>
                  <h3 className="mt-5 font-display text-2xl font-medium">{d.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-brand-muted">{d.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Photo + story */}
        <section className="bg-brand-cream py-16 md:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2 md:gap-16 md:px-6">
            <div className="relative aspect-square w-full overflow-hidden bg-brand-stone">
              <Image
                src={PRODUCT_PHOTO}
                alt="V-Fringe Diamond Necklace in gold with diamond pavé drops"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-contain"
              />
              <span className="absolute inset-3 border border-brand-gold/40" aria-hidden />
            </div>
            <div className="text-center md:text-left">
              <p className="text-[11px] uppercase tracking-[0.35em] text-brand-gold-deep">See It · Then Wear It</p>
              <h2 className="mt-3 font-display text-4xl font-medium leading-tight md:text-5xl">
                From every angle,
                <br />
                <em className="font-normal text-brand-gold-deep">on you.</em>
              </h2>
              <GoldDivider className="my-6 justify-center md:justify-start" />
              <p className="mx-auto max-w-md text-[15px] leading-7 text-brand-muted md:mx-0">
                Turn the necklace in full 3D to study the fringe and pavé up close, then use your phone&apos;s front
                camera to see how it drapes along your neckline — live.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
                <Link
                  href="/ar/necklace"
                  className="flex h-14 w-full max-w-xs items-center justify-center rounded-full bg-brand-ink px-8 text-xs font-medium uppercase tracking-[0.25em] whitespace-nowrap text-brand-gold-light transition-colors hover:bg-black sm:w-auto"
                >
                  Try It On
                </Link>
                <Link
                  href="/product/necklace"
                  className="flex h-14 w-full max-w-xs items-center justify-center rounded-full border border-brand-ink/20 px-8 text-xs font-medium uppercase tracking-[0.25em] whitespace-nowrap transition-colors hover:border-brand-gold sm:w-auto"
                >
                  Explore in 3D
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Try-on */}
        <section id="try-on" className="bg-brand-ink py-16 text-white md:py-24">
          <div className="mx-auto max-w-6xl px-4 text-center md:px-6">
            <p className="text-[11px] uppercase tracking-[0.35em] text-brand-gold">Virtual Try-On</p>
            <h2 className="mt-3 font-display text-4xl font-medium text-brand-gold-light md:text-5xl">
              Try it on in three steps
            </h2>
            <GoldDivider className="mt-6 justify-center" />
            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {TRY_ON_STEPS.map((step, i) => (
                <li key={step.title} className="flex flex-col items-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-gold font-display text-xl text-brand-gold">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-display text-2xl">{step.title}</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-white/65">{step.body}</p>
                </li>
              ))}
            </ol>
            <Link
              href="/ar/necklace"
              className="mx-auto mt-12 flex h-14 w-full max-w-xs items-center justify-center rounded-full bg-brand-gold text-xs font-medium uppercase tracking-[0.25em] whitespace-nowrap text-brand-ink transition-colors hover:bg-brand-gold-light"
            >
              Start Virtual Try-On
            </Link>
            <p className="mt-4 text-xs text-white/45">Works best in Chrome or Safari on a phone, in good light.</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-brand-gold/25 bg-brand-cream">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 text-center md:px-6">
          <Image src={LOGO} alt="D. Harris Nadar Diamonds & Jewellery" width={300} height={87} className="h-10 w-auto" />
          <GoldDivider />
          <div className="text-[11px] uppercase tracking-[0.2em] text-brand-muted">
            <span>AR demo lab:</span>{" "}
            {demoProducts.map((p, i) => (
              <span key={p.id}>
                {i > 0 && <span className="px-2 text-brand-gold">·</span>}
                <Link href={`/product/${p.id}`} className="hover:text-brand-gold-deep">
                  {p.name}
                </Link>
              </span>
            ))}
          </div>
          <p className="text-xs text-brand-muted">
            © {new Date().getFullYear()} D. Harris Nadar Diamonds &amp; Jewellery
          </p>
        </div>
      </footer>
    </div>
  );
}
