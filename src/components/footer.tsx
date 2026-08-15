import Link from "next/link";
import { Phone, MessageCircle, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-lg font-bold">ClickCo</div>
            <p className="mt-1 text-sm text-muted">
              Logo Design & Web Development
            </p>
          </div>

          <div className="flex flex-col gap-3 text-sm">
            <a
              href="tel:+918130614878"
              className="flex items-center gap-2 text-muted hover:text-foreground transition"
            >
              <Phone size={15} />
              +91 81306 14878
            </a>
            <a
              href="https://wa.me/919211907631"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted hover:text-foreground transition"
            >
              <MessageCircle size={15} />
              WhatsApp +91 92119 07631
            </a>
            <a
              href="mailto:biggauravkumar@gmail.com"
              className="flex items-center gap-2 text-muted hover:text-foreground transition"
            >
              <Mail size={15} />
              biggauravkumar@gmail.com
            </a>
          </div>

          <div className="flex gap-6 text-sm text-muted">
            <Link href="/work" className="hover:text-foreground">Work</Link>
            <Link href="/services" className="hover:text-foreground">Services</Link>
            <Link href="/about" className="hover:text-foreground">About</Link>
            <Link href="/contact" className="hover:text-foreground">Contact</Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 text-sm text-muted md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} ClickCo. All rights reserved.</p>
          <p>Logos that last. Websites that work.</p>
        </div>
      </div>
    </footer>
  );
}
