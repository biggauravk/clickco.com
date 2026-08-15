import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const projects = [
  {
    title: "Horizon Apparel",
    category: "Logo & Brand Identity",
    description: "Clean wordmark and visual system for a modern clothing brand focused on everyday essentials.",
    year: "2025",
    image: "/images/horizon-apparel.jpg",
  },
  {
    title: "NovaTech",
    category: "Website Design + Development",
    description: "Fast, conversion-focused marketing site for a SaaS product with clear messaging and strong CTAs.",
    year: "2025",
    image: "/images/novatech.jpg",
  },
  {
    title: "Bloom Organics",
    category: "Logo + Packaging",
    description: "Natural yet premium identity and packaging system for an organic skincare line.",
    year: "2024",
    image: "/images/bloom-organics.jpg",
  },
  {
    title: "Vertex Solutions",
    category: "Full Brand + Web Platform",
    description: "Complete visual identity and website for a B2B consulting firm targeting growth-stage companies.",
    year: "2025",
    image: "/images/vertex-solutions.jpg",
  },
  {
    title: "Lumen Studio",
    category: "Logo Design",
    description: "Minimal geometric mark with strong recognition across digital and print applications.",
    year: "2024",
    image: "/images/lumen-studio.jpg",
  },
  {
    title: "Orbit Finance",
    category: "Website Redesign",
    description: "Clarity-focused redesign that improved trust signals and simplified the user journey.",
    year: "2025",
    image: "/images/orbit-finance.jpg",
  },
];

export default function WorkPage() {
  return (
    <div className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Work</h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          Selected logo systems, brand identities, and websites we’ve designed
          and built for growing brands.
        </p>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.title}
              className="group overflow-hidden rounded-2xl border border-border transition hover:border-foreground/20"
            >
              <div className="relative aspect-[3/2] overflow-hidden">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">{project.title}</h2>
                    <p className="mt-1 text-sm text-muted">{project.category}</p>
                  </div>
                  <span className="text-sm text-muted">{project.year}</span>
                </div>
                <p className="mt-3 text-sm text-muted leading-relaxed">
                  {project.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 rounded-2xl border border-border bg-card p-10 text-center">
          <h2 className="text-2xl font-bold">Have a project in mind?</h2>
          <p className="mt-3 text-muted">
            We’re currently taking on new logo and website projects.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background"
          >
            Start a conversation <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
