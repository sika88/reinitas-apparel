import PolicyPage from "@/components/policy-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Privacy policy" };

export default function Page() {
  return <PolicyPage slug="privacy" />;
}
