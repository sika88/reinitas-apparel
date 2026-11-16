import PageHeader from "@/components/admin/page-header";
import PolicyForm from "@/components/admin/policy-form";
import { requireAdmin } from "@/lib/admin";
import { POLICIES, POLICY_SLUGS } from "@/lib/policy-defaults";

export const metadata = { title: "Pages" };

export default async function PagesAdmin() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("policy_pages").select("slug,body");
  const rows = new Map((data ?? []).map((r) => [r.slug as string, r.body as string]));

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader
        title="Pages"
        description="Edit the text of your policy pages. Changes go live as soon as you save. Add your real delivery costs, timings and returns window."
      />
      {POLICY_SLUGS.map((slug) => (
        <PolicyForm
          key={slug}
          slug={slug}
          title={POLICIES[slug].title}
          initialBody={rows.get(slug) ?? POLICIES[slug].body}
          defaultBody={POLICIES[slug].body}
          isCustom={rows.has(slug)}
        />
      ))}
    </div>
  );
}
