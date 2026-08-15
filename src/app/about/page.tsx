import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">About</h1>
        
        <div className="mt-10 space-y-6 text-lg leading-relaxed text-muted">
          <p>
            ClickCo is a focused design and development studio. We help brands
            create clear visual identities and websites that actually perform.
          </p>
          <p>
            We believe the best logos and websites share the same qualities:
            clarity, intention, and restraint. We don’t chase trends. We aim
            for work that still feels right years later.
          </p>
          <p>
            Our process is collaborative and straightforward. We listen
            carefully, explore options thoughtfully, and deliver polished,
            production-ready results.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          <div>
            <div className="text-3xl font-bold">Logo first</div>
            <p className="mt-2 text-sm text-muted">
              Strong marks that become the foundation of the brand.
            </p>
          </div>
          <div>
            <div className="text-3xl font-bold">Web that converts</div>
            <p className="mt-2 text-sm text-muted">
              Design and code working together for real results.
            </p>
          </div>
          <div>
            <div className="text-3xl font-bold">Clear process</div>
            <p className="mt-2 text-sm text-muted">
              Transparent steps, no surprises, high craft.
            </p>
          </div>
        </div>

        <div className="mt-20 rounded-2xl border border-border p-8 md:p-10">
          <h2 className="text-2xl font-bold">Let’s work together</h2>
          <p className="mt-3 text-muted">
            Whether you need a new logo, a complete identity, or a website from
            scratch — we’d love to hear about your project.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background"
          >
            Get in touch <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
