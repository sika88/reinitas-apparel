import ProsePage from "@/components/prose-page";
import { waLink } from "@/lib/format";
import { getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Delivery and returns" };

// REVIEW WITH THE CLIENT: add the real delivery areas, costs, timings and the exact returns or exchange window.
export default async function DeliveryReturnsPage() {
  const s = await getSettings();
  const whatsapp = s.whatsapp_number ? (
    <a href={waLink(s.whatsapp_number, "Hello! I need help with my order.")} target="_blank" rel="noopener noreferrer">
      message us on WhatsApp
    </a>
  ) : (
    <>contact us</>
  );

  return (
    <ProsePage title="Delivery and returns" updated="14 November 2026">
      <h2>Delivery</h2>
      <p>
        After you place an order, we contact you by phone or WhatsApp to confirm your address and delivery details,
        including the delivery cost and timing, before your order is sent.
      </p>
      <p>
        If you chose pay on delivery, please have the amount ready when your order arrives. Please keep your phone on so
        that our rider or team can reach you.
      </p>

      <h2>If something is wrong with your order</h2>
      <p>
        If your item arrives damaged, faulty or is not what you ordered, {whatsapp} as soon as you receive it. Please
        include your order reference and a clear photo, and we will arrange a replacement or a refund.
      </p>

      <h2>Sizes and exchanges</h2>
      <p>
        If you are unsure about a size, {whatsapp} before you order and we will help you choose. If an item does not fit,
        contact us and we will tell you whether an exchange is possible.
      </p>

      <h2>Refunds</h2>
      <p>
        Where a refund is due, it is made to the way you paid. Online payments are refunded through Paystack to your
        original payment method.
      </p>
    </ProsePage>
  );
}
