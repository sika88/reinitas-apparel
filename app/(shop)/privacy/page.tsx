import ProsePage from "@/components/prose-page";
import { waLink } from "@/lib/format";
import { getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Privacy policy" };

// REVIEW WITH THE CLIENT before launch. If analytics, ads or newsletters are added later, update this page.
export default async function PrivacyPage() {
  const s = await getSettings();
  const name = s.business_name;
  const contact = s.whatsapp_number ? (
    <a href={waLink(s.whatsapp_number, "Hello! I have a question about my personal data.")} target="_blank" rel="noopener noreferrer">
      message us on WhatsApp
    </a>
  ) : (
    <>contact us using the details on this website</>
  );

  return (
    <ProsePage title="Privacy policy" updated="14 November 2026">
      <p>
        This policy explains what personal information {name} collects when you shop on this website, why we collect it,
        and the choices you have.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>Your name, phone number and delivery address, so we can deliver your order and contact you about it.</li>
        <li>Your email address, which is needed for online payment and optional for pay on delivery.</li>
        <li>The items you order and any note you add to your order.</li>
      </ul>
      <p>
        We do not see or store your card or Mobile Money details. Online payments are handled by our payment provider,
        Paystack.
      </p>

      <h2>How we use it</h2>
      <ul>
        <li>To process, deliver and support your order.</li>
        <li>To alert our team about new orders. Your name, phone number and city appear in that internal alert.</li>
        <li>
          To protect the website from abuse. We keep a short-lived, anonymised record of requests to stop spam orders.
        </li>
      </ul>

      <h2>Who we share it with</h2>
      <p>
        Only the services we need to run the shop: our payment provider (Paystack), our SMS provider (for internal order
        alerts), and our website hosting and database providers. We do not sell your information.
      </p>

      <h2>How long we keep it</h2>
      <p>We keep order records for as long as we need them for our business records and our legal obligations.</p>

      <h2>Your cart and cookies</h2>
      <p>
        Your cart is saved in your own browser so it is still there when you come back. We do not use advertising
        trackers.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask us what information we hold about you, ask us to correct it, or ask us to delete it where the law
        allows. To do so, {contact}.
      </p>

      <h2>Changes to this policy</h2>
      <p>If we change this policy, we will update the date at the top of this page.</p>
    </ProsePage>
  );
}
