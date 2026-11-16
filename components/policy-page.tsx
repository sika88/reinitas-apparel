import PolicyBody from "@/components/policy-body";
import ProsePage from "@/components/prose-page";
import { waLink } from "@/lib/format";
import { POLICIES, POLICY_DEFAULT_DATE, type PolicySlug } from "@/lib/policy-defaults";
import { getSettings } from "@/lib/queries";
import { publicClient } from "@/lib/supabase/public";

export default async function PolicyPage({ slug }: { slug: PolicySlug }) {
  const [settings, { data: row }] = await Promise.all([
    getSettings(),
    publicClient().from("policy_pages").select("title,body,updated_at").eq("slug", slug).maybeSingle(),
  ]);

  const def = POLICIES[slug];
  const title = row?.title || def.title;
  let body = (row?.body || def.body).split("{business}").join(settings.business_name);

  if (settings.whatsapp_number) {
    body = body
      .split("{whatsapp}")
      .join(waLink(settings.whatsapp_number, "Hello! I have a question."));
  } else {
    body = body.replace(/\[([^\]]+)\]\(\{whatsapp\}\)/g, "$1"); // no number yet: show plain text
  }

  const updated = row?.updated_at
    ? new Date(row.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Accra" })
    : POLICY_DEFAULT_DATE;

  return (
    <ProsePage title={title} updated={updated}>
      <PolicyBody body={body} />
    </ProsePage>
  );
}
