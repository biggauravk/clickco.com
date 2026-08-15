"use client";

import { useState } from "react";
import { ArrowRight, Phone, MessageCircle, Mail } from "lucide-react";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");

    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const company = formData.get("company") as string;
    const service = formData.get("service") as string;
    const budget = formData.get("budget") as string;
    const timeline = formData.get("timeline") as string;
    const message = formData.get("message") as string;

    const body = `
New Project Inquiry – ClickCo

────────────────────────
CLIENT DETAILS
────────────────────────
Name: ${name}
Email: ${email}
Phone / WhatsApp: ${phone || "Not provided"}
Company / Brand: ${company || "Not provided"}

────────────────────────
PROJECT DETAILS
────────────────────────
Service needed: ${service}
Budget range: ${budget || "Not specified"}
Timeline: ${timeline || "Not specified"}

────────────────────────
MESSAGE FROM CLIENT
────────────────────────
"${message}"

────────────────────────
Submitted from ClickCo website
    `.trim();

    try {
      const mailtoLink = `mailto:biggauravkumar@gmail.com?subject=${encodeURIComponent(
        `New Inquiry from ${name} – ${service}`
      )}&body=${encodeURIComponent(body)}`;

      window.location.href = mailtoLink;

      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("error");
    }
  }

  return (
    <div className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Contact
        </h1>
        <p className="mt-4 text-lg text-muted">
          Tell us about your project. We usually reply within one business day.
        </p>

        {/* Quick contact options */}
        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="https://wa.me/919211907631"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-border/30 transition"
          >
            <MessageCircle size={16} />
            WhatsApp
          </a>
          <a
            href="tel:+918130614878"
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-border/30 transition"
          >
            <Phone size={16} />
            Call
          </a>
          <a
            href="mailto:biggauravkumar@gmail.com"
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-border/30 transition"
          >
            <Mail size={16} />
            Email
          </a>
        </div>

        {status === "sent" ? (
          <div className="mt-12 rounded-2xl border border-border bg-card p-10 text-center">
            <h2 className="text-2xl font-bold">Message ready</h2>
            <p className="mt-3 text-muted">
              Your email client should open with a pre-filled message. Just hit send.
              If it didn’t open, write to us at{" "}
              <a href="mailto:biggauravkumar@gmail.com" className="underline">
                biggauravkumar@gmail.com
              </a>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-12 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium">
                  Your Name *
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium">
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-medium">
                  Phone / WhatsApp
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label htmlFor="company" className="mb-2 block text-sm font-medium">
                  Company / Brand Name
                </label>
                <input
                  id="company"
                  name="company"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <label htmlFor="service" className="mb-2 block text-sm font-medium">
                What do you need? *
              </label>
              <select
                id="service"
                name="service"
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent"
              >
                <option value="">Select an option</option>
                <option value="Logo Design">Logo Design</option>
                <option value="Brand Identity">Brand Identity (Logo + System)</option>
                <option value="Website Design">Website Design only</option>
                <option value="Web Development">Website Development only</option>
                <option value="Logo + Website">Logo + Website (Full package)</option>
                <option value="Other">Something else</option>
              </select>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="budget" className="mb-2 block text-sm font-medium">
                  Budget Range
                </label>
                <select
                  id="budget"
                  name="budget"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent"
                >
                  <option value="">Prefer not to say</option>
                  <option value="Under ₹15,000">Under ₹15,000</option>
                  <option value="₹15,000 – ₹35,000">₹15,000 – ₹35,000</option>
                  <option value="₹35,000 – ₹75,000">₹35,000 – ₹75,000</option>
                  <option value="₹75,000 – ₹1.5 Lakh">₹75,000 – ₹1.5 Lakh</option>
                  <option value="Above ₹1.5 Lakh">Above ₹1.5 Lakh</option>
                </select>
              </div>
              <div>
                <label htmlFor="timeline" className="mb-2 block text-sm font-medium">
                  Timeline
                </label>
                <select
                  id="timeline"
                  name="timeline"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent"
                >
                  <option value="">Not sure yet</option>
                  <option value="ASAP (1–2 weeks)">ASAP (1–2 weeks)</option>
                  <option value="2–4 weeks">2–4 weeks</option>
                  <option value="1–2 months">1–2 months</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="message" className="mb-2 block text-sm font-medium">
                Tell us about your project *
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent resize-none"
                placeholder="What is your brand about? What are you looking to achieve? Any specific style or references you like?"
              />
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-4 text-sm font-medium text-background disabled:opacity-60 hover:opacity-90 transition"
            >
              {status === "sending" ? "Preparing..." : "Send Inquiry"}
              <ArrowRight size={16} />
            </button>

            {status === "error" && (
              <p className="text-sm text-red-500">
                Something went wrong. Please email us directly at biggauravkumar@gmail.com
              </p>
            )}
          </form>
        )}

        <div className="mt-16 border-t border-border pt-10 text-sm text-muted">
          <p className="font-medium text-foreground mb-2">Prefer to reach out directly?</p>
          <p>
            WhatsApp:{" "}
            <a href="https://wa.me/919211907631" className="underline hover:text-foreground">
              +91 92119 07631
            </a>
          </p>
          <p>
            Call:{" "}
            <a href="tel:+918130614878" className="underline hover:text-foreground">
              +91 81306 14878
            </a>
          </p>
          <p>
            Email:{" "}
            <a href="mailto:biggauravkumar@gmail.com" className="underline hover:text-foreground">
              biggauravkumar@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
