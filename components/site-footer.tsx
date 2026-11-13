import { waLink } from "@/lib/format";
import type { SiteSettings } from "@/lib/types";

export default function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {settings.business_name}. All rights reserved.
        </p>
        {settings.whatsapp_number && (
          <a
            href={waLink(settings.whatsapp_number, "Hello! I'd like to ask about your products.")}
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-accent"
          >
            Chat with us on WhatsApp
          </a>
        )}
      </div>
    </footer>
  );
}
