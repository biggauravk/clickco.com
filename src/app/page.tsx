import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const projects = [
  {
    title: "Horizon Apparel",
    category: "Logo & Brand Identity",
    year: "2025",
    image: "/images/horizon-apparel.jpg",
  },
  {
    title: "NovaTech",
    category: "Website Design + Development",
    year: "2025",
    image: "/images/novatech.jpg",
  },
  {
    title: "Bloom Organics",
    category: "Logo + Packaging System",
    year: "2024",
    image: "/images/bloom-organics.jpg",
  },
  {
    title: "Vertex Solutions",
    category: "Full Brand + Web Platform",
    year: "2025",
    image: "/images/vertex-solutions.jpg",
  },
];

const services = [
  {
    number: "01",
    title: "Logo Design",
    description:
      "Distinctive marks that work at every size — from app icon to billboard. Clear, memorable, and built to last.",
  },
  {
    number: "02",
    title: "Brand Identity",
    description:
      "Complete visual systems: color, type, guidelines and applications so your brand feels consistent everywhere.",
  },
  {
    number: "03",
    title: "Website Design",
    description:
      "Clean, conversion-focused interfaces that reflect your brand and guide users with clarity and speed.",
  },
  {
    number: "04",
    title: "Web Development",
    description:
      "Modern, fast and maintainable websites. Performance, SEO and mobile experience are built in from the start.",
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-20 pb-24 md:pt-32 md:pb-32">
        <div className="mx-auto max-w-6xl">
          <p className="mb-6 text-sm font-medium uppercase tracking-widest text-muted">
            Logo Design · Web Design · Development
          </p>
          <h1 className="max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl lg:text-8xl">
            Logos that last.
            <br />
            Websites that work.
          </h1>
          <p className="mt-8 max-w-xl text-lg text-muted md:text-xl">
            ClickCo helps founders and growing brands create clear visual
            identities and high-performing digital experiences.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-medium text-background hover:opacity-90 transition"
            >
              Start a project
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/work"
              className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm font-medium hover:bg-border/30 transition"
            >
              View work
            </Link>
          </div>
        </div>
      </section>

      {/* Selected Work */}
      <section className="border-t border-border px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Selected Work
              </h2>
              <p className="mt-2 text-muted">
                Recent logo systems and websites we’ve crafted.
              </p>
            </div>
            <Link
              href="/work"
              className="hidden items-center gap-1 text-sm font-medium hover:underline md:inline-flex"
            >
              See all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {projects.map((project) => (
              <Link
                key={project.title}
                href="/work"
                className="group relative overflow-hidden rounded-2xl border border-border bg-background transition hover:border-foreground/20"
              >
                <div className="relative aspect-[3/2] overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="flex items-start justify-between p-6">
                  <div>
                    <h3 className="text-xl font-semibold">{project.title}</h3>
                    <p className="mt-1 text-sm text-muted">{project.category}</p>
                  </div>
                  <span className="text-sm text-muted">{project.year}</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link href="/work" className="text-sm font-medium underline">
              See all projects
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="border-t border-border bg-card px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            What we do
          </h2>
          <p className="mt-3 max-w-xl text-muted">
            Focused expertise in the two things that matter most: a strong mark
            and a website that converts.
          </p>

          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {services.map((service) => (
              <div
                key={service.number}
                className="rounded-2xl border border-border bg-background p-8"
              >
                <span className="text-sm font-medium text-accent">
                  {service.number}
                </span>
                <h3 className="mt-3 text-xl font-semibold">{service.title}</h3>
                <p className="mt-3 text-muted leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
            >
              Full service details <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border px-6 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Ready to build something clear and memorable?
          </h2>
          <p className="mt-6 text-lg text-muted">
            Tell us about your brand. We’ll reply within one business day.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-4 text-sm font-medium text-background hover:opacity-90 transition"
            >
              Get in touch
              <ArrowRight size={16} />
            </Link>
            <a
              href="https://wa.me/919211907631"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-sm font-medium hover:bg-border/30 transition"
            >
              WhatsApp us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
