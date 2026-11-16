import PolicyPage from "@/components/policy-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Terms of sale" };

export default function Page() {
  return <PolicyPage slug="terms" />;
}
