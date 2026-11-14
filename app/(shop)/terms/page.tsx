import ProsePage from "@/components/prose-page";
import { getSettings } from "@/lib/queries";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Terms of sale" };

// REVIEW WITH THE CLIENT before launch.
export default async function TermsPage() {
  const s = await getSettings();
  const name = s.business_name;

  return (
    <ProsePage title="Terms of sale" updated="14 November 2026">
      <p>These terms apply to every order you place with {name} through this website.</p>

      <h2>Prices and availability</h2>
      <p>
        All prices are in Ghana cedis (GHS). Stock is checked when you place your order. If an item turns out to be
        unavailable, we will tell you and refund any payment you have made for it.
      </p>

      <h2>Placing an order</h2>
      <p>
        When you place an order, you are making an offer to buy. Your order is confirmed once we have received it and,
        for online payments, once your payment has been confirmed. We may cancel an order if we cannot reach you to
        arrange delivery or if an item is unavailable, and any payment will be refunded.
      </p>

      <h2>Payment</h2>
      <p>
        You can pay online by Mobile Money or card through Paystack, or choose to pay on delivery. Pay on delivery orders
        are paid when the order arrives.
      </p>

      <h2>Delivery and returns</h2>
      <p>
        See our <Link href="/delivery-returns">delivery and returns</Link> page for how delivery works and what to do if
        something is wrong with your order.
      </p>

      <h2>Product information</h2>
      <p>
        We try to show our products as accurately as we can. Colours may look slightly different on different screens.
      </p>

      <h2>Your information</h2>
      <p>
        How we handle your personal information is explained in our <Link href="/privacy">privacy policy</Link>.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of Ghana.</p>
    </ProsePage>
  );
}
