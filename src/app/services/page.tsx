import Link from "next/link";
import { ArrowRight } from "lucide-react";

const services = [
  {
    title: "Logo Design",
    description:
      "We create distinctive, scalable logos that capture the essence of your brand. Every mark is designed to work across digital and print applications.",
    process: [
      "Discovery & brand alignment",
      "Concept exploration",
      "Refinement & iterations",
      "Final files + usage guidelines",
    ],
  },
  {
    title: "Brand Identity",
    description:
      "A complete visual language — colors, typography, iconography, and rules — so your brand feels consistent and professional everywhere it appears.",
    process: [
      "Strategy & positioning",
      "Visual system design",
      "Brand guidelines",
      "Application examples",
    ],
  },
  {
    title: "Website Design",
    description:
      "Interfaces that are clear, beautiful, and focused on results. We design for the user while staying true to your brand.",
    process: [
      "UX structure & wireframes",
      "Visual design & prototypes",
      "Responsive design systems",
      "Handoff or full development",
    ],
  },
  {
    title: "Web Development",
    description:
      "Fast, modern, maintainable websites. Performance, accessibility, and SEO are built in from day one.",
    process: [
      "Technical planning",
      "Frontend development",
      "CMS integration (optional)",
      "Launch & optimization",
    ],
  },
];

export default function ServicesPage() {
  return (
    <div className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Services
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          We focus on two things that move the needle for most brands: a strong
          logo system and a website that performs.
        </p>

        <div className="mt-16 space-y-16">
          {services.map((service, i) => (
            <div
              key={service.title}
              className="grid gap-8 border-t border-border pt-12 md:grid-cols-2"
            >
              <div>
                <span className="text-sm font-medium text-accent">
                  0{i + 1}
                </span>
                <h2 className="mt-2 text-2xl font-bold md:text-3xl">
                  {service.title}
                </h2>
                <p className="mt-4 text-muted leading-relaxed">
                  {service.description}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium uppercase tracking-wider text-muted">
                  Process
                </h3>
                <ul className="mt-4 space-y-3">
                  {service.process.map((step) => (
                    <li key={step} className="flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-4 text-sm font-medium text-background"
          >
            Discuss your project <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
