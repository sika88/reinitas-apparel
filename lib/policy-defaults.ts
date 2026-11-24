export type PolicySlug = "privacy" | "terms" | "delivery-returns";
export const POLICY_SLUGS: PolicySlug[] = ["delivery-returns", "terms", "privacy"];
export const POLICY_DEFAULT_DATE = "16 November 2026";

// Tokens: {business} = business name, [text]({whatsapp}) = WhatsApp link
export const POLICIES: Record<PolicySlug, { title: string; body: string }> = {
  privacy: {
    title: "Privacy policy",
    body: `This policy explains what personal information {business} collects when you shop on this website, why we collect it, and the choices you have.

## What we collect

- Your name, phone number and delivery address, so we can deliver your order and contact you about it.
- Your email address, if you choose to give one. It is optional and is used for your payment receipt.
- The items you order and any note you add to your order.

We do not see or store your card details. Online payments are handled by our payment provider, Paystack. If you pay by MoMo directly to us, we see the payment details your mobile money provider shows us, such as the sender’s name and number.

## How we use it

- To process, deliver and support your order.
- To alert our team about new orders. Your name, phone number and city appear in that internal alert.
- To protect the website from abuse. We keep a short-lived, anonymised record of requests to stop spam orders.

## Who we share it with

Only the services we need to run the shop: our payment provider (Paystack), our SMS provider (for internal order alerts), and our website hosting and database providers. We do not sell your information.

## How long we keep it

We keep order records for as long as we need them for our business records and our legal obligations.

## Your cart and cookies

Your cart is saved in your own browser so it is still there when you come back. We do not use advertising trackers.

## Your rights

You can ask us what information we hold about you, ask us to correct it, or ask us to delete it where the law allows. To do so, [message us on WhatsApp]({whatsapp}).

## Changes to this policy

If we change this policy, we will update the date at the top of this page.`,
  },
  terms: {
    title: "Terms of sale",
    body: `These terms apply to every order you place with {business} through this website.

## Prices and availability

All prices are in Ghana cedis (GHS). Stock is checked when you place your order. If an item turns out to be unavailable, we will tell you and refund any payment you have made for it.

## Placing an order

When you place an order, you are making an offer to buy. Your order is confirmed once we have received it and your payment has been confirmed. We may cancel an order if we cannot reach you to arrange delivery or if an item is unavailable, and any payment will be refunded.

## Payment

You can pay online by card or Mobile Money through Paystack, or choose to pay with MoMo directly to our MoMo number. Online payments are confirmed straight away. MoMo orders are confirmed once we have received your payment. If we do not receive it within 48 hours we may cancel the order and release the items. If you paid and your order was cancelled, message us and we will sort it out.

## Delivery and returns

See our [delivery and returns](/delivery-returns) page for how delivery works and what to do if something is wrong with your order.

## Product information

We try to show our products as accurately as we can. Colours may look slightly different on different screens.

## Your information

How we handle your personal information is explained in our [privacy policy](/privacy).

## Governing law

These terms are governed by the laws of Ghana.`,
  },
  "delivery-returns": {
    title: "Delivery and returns",
    body: `## Delivery

After you place an order, we contact you by phone or WhatsApp to confirm your address and delivery details, including the delivery cost and timing, before your order is sent.

Please keep your phone on so that our team can reach you.

## Paying with MoMo

If you chose to pay with MoMo, send the amount shown after checkout to the MoMo number on the confirmation page, then message us on WhatsApp with your confirmation so we can match your payment. We start preparing your order once your payment is confirmed.

## If something is wrong with your order

If your item arrives damaged, faulty or is not what you ordered, [message us on WhatsApp]({whatsapp}) as soon as you receive it. Include your order reference and a clear photo, and we will arrange a replacement or a refund.

## Sizes and exchanges

If you are unsure about a size, [message us on WhatsApp]({whatsapp}) before you order and we will help you choose. If an item does not fit, contact us and we will tell you whether an exchange is possible.

## Refunds

Where a refund is due, it is made to the way you paid. Online payments are refunded through Paystack to your original payment method, and MoMo payments are refunded to the MoMo number you paid from.`,
  },
};
