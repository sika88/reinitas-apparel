import Image from "next/image";
import Link from "next/link";
import ActionButton from "@/components/admin/action-button";
import PageHeader from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin";
import { deleteProduct, setProductActive } from "@/lib/actions/products";
import { formatPrice, sortSizes } from "@/lib/format";
import { discountedPrice } from "@/lib/pricing";
import { toVariants } from "@/lib/queries";
export const metadata = { title: "Products" };

type Search = { q?: string; status?: string; category?: string; size?: string };
type Row = {
  id: string;
  name: string;
  price_pesewas: number;
  discount_percent: number | null;
  images: string[];
  active: boolean;
  featured: boolean;
  category: { name: string } | null;
  variants: { size: string; stock: number }[];
};

const sizeOf = (p: Row) => {
  const s = p.variants[0]?.size;
  return s && s !== "One size" ? s : null;
};

function Thumb({ src, name }: { src?: string; name: string }) {
  return (
    <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-cream">
      {src ? (
        <Image src={src} alt="" fill sizes="56px" className="object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center font-display text-2xl text-accent/30">{name.charAt(0)}</div>
      )}
    </div>
  );
}

function Price({ p }: { p: Row }) {
  if (!p.discount_percent) return <>{formatPrice(p.price_pesewas)}</>;
  return (
    <span>
      <span className="font-medium text-accent">{formatPrice(discountedPrice(p.price_pesewas, p.discount_percent))}</span>{" "}
      <s className="text-xs text-muted">{formatPrice(p.price_pesewas)}</s>{" "}
      <span className="rounded-full bg-gold/30 px-1.5 py-0.5 text-[11px] font-medium text-accent-dark">−{p.discount_percent}%</span>
    </span>
  );
}

function Stock({ variants }: { variants: Row["variants"] }) {
  const total = variants.reduce((n, v) => n + v.stock, 0);
  return <span className={total === 0 ? "font-medium text-red-600" : ""}>{total === 0 ? "Sold out" : `${total} in stock`}</span>;
}

function Actions({ p }: { p: Row }) {
  const link = "text-sm text-accent underline underline-offset-4";
  const quiet = "text-sm text-muted underline underline-offset-4 transition hover:text-foreground disabled:opacity-50";
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <Link href={`/admin/products/${p.id}`} className={link}>
        Edit<span className="sr-only"> {p.name}</span>
      </Link>
      <Link href={`/admin/products/new?from=${p.id}`} className={link}>
        Add another size<span className="sr-only"> of {p.name}</span>
      </Link>
      <ActionButton
        action={setProductActive.bind(null, p.id, !p.active)}
        successMessage={p.active ? "Product hidden from the shop" : "Product is now visible"}
        className={quiet}
      >
        {p.active ? "Hide" : "Show"}
        <span className="sr-only"> {p.name}</span>
      </ActionButton>
      <ActionButton
        action={deleteProduct.bind(null, p.id)}
        confirm={`Delete "${p.name}"${sizeOf(p) ? ` (size ${sizeOf(p)})` : ""}? This cannot be undone.`}
        successMessage="Product deleted"
        className="text-sm text-muted underline underline-offset-4 transition hover:text-red-600 disabled:opacity-50"
      >
        Delete<span className="sr-only"> {p.name}</span>
      </ActionButton>
    </div>
  );
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const status = (["visible", "hidden"] as const).find((s) => s === sp.status) ?? "all";
  const q = (sp.q ?? "").replace(/[,()%*\\]/g, " ").trim().slice(0, 60);

  const { supabase } = await requireAdmin();
  const { data: catData } = await supabase.from("categories").select("id,name,slug").order("sort_order");
  const cats = (catData ?? []) as { id: string; name: string; slug: string }[];
  const activeCat = cats.find((c) => c.slug === sp.category);

  let query = supabase
    .from("products")
    .select("id,name,price_pesewas,discount_percent,images,active,featured,category:categories(name),variants:product_variants(size,stock)")
    .order("created_at", { ascending: false });
  if (q) query = query.ilike("name", `%${q}%`);
  if (status === "visible") query = query.eq("active", true);
  if (status === "hidden") query = query.eq("active", false);
  if (activeCat) query = query.eq("category_id", activeCat.id);

  const { data } = await query;
  const all = ((data ?? []) as unknown as Row[]).map((p) => ({
  ...p,
  variants: toVariants(p.variants) as Row["variants"],
  }));

  const sizes = sortSizes([...new Set(all.map(sizeOf).filter((s): s is string => Boolean(s)))].map((size) => ({ size }))).map((s) => s.size);
  const activeSize = sp.size && sizes.includes(sp.size) ? sp.size : undefined;
  const rows = activeSize ? all.filter((p) => sizeOf(p) === activeSize) : all;

  const base: Record<string, string | undefined> = {
    q: q || undefined,
    status: status === "all" ? undefined : status,
    category: activeCat?.slug,
    size: activeSize,
  };
  const href = (next: Record<string, string | undefined> = {}) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...base, ...next })) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/admin/products?${s}` : "/admin/products";
  };
  const pill = (active: boolean) =>
    `inline-flex min-h-10 items-center rounded-full border px-4 text-sm transition ${
      active ? "border-accent bg-accent text-white" : "border-border bg-surface hover:border-accent"
    }`;

  return (
    <div>
      <PageHeader
        title="Products"
        description="Each listing is one item in one size. Use “Add another size” to post the same item in a different size."
        actions={
          <Link href="/admin/products/new" className="btn-primary">
            + New product
          </Link>
        }
      />

      <form action="/admin/products" method="get" role="search" className="flex flex-wrap gap-2">
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        {activeCat && <input type="hidden" name="category" value={activeCat.slug} />}
        {activeSize && <input type="hidden" name="size" value={activeSize} />}
        <label htmlFor="product-search" className="sr-only">
          Search products
        </label>
        <input id="product-search" name="q" defaultValue={q} placeholder="Search products" className="field max-w-md flex-1" />
        <button className="btn-primary">Search</button>
        {q && (
          <Link href={href({ q: undefined })} className="inline-flex min-h-11 items-center px-3 text-sm text-muted underline underline-offset-4">
            Clear
          </Link>
        )}
      </form>

      <div className="mt-5 space-y-3">
        <nav aria-label="Visibility" className="flex flex-wrap gap-2">
          {(["all", "visible", "hidden"] as const).map((s) => (
            <Link key={s} href={href({ status: s === "all" ? undefined : s })} aria-current={status === s ? "page" : undefined} className={`${pill(status === s)} capitalize`}>
              {s}
            </Link>
          ))}
        </nav>
        <nav aria-label="Category" className="flex flex-wrap gap-2">
          <Link href={href({ category: undefined, size: undefined })} aria-current={!activeCat ? "page" : undefined} className={pill(!activeCat)}>
            All categories
          </Link>
          {cats.map((c) => (
            <Link key={c.id} href={href({ category: c.slug, size: undefined })} aria-current={activeCat?.id === c.id ? "page" : undefined} className={pill(activeCat?.id === c.id)}>
              {c.name}
            </Link>
          ))}
        </nav>
        {sizes.length > 0 && (
          <nav aria-label="Size" className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted">Size</span>
            <Link href={href({ size: undefined })} aria-current={!activeSize ? "page" : undefined} className={pill(!activeSize)}>
              All
            </Link>
            {sizes.map((s) => (
              <Link key={s} href={href({ size: s })} aria-current={activeSize === s ? "page" : undefined} className={pill(activeSize === s)}>
                {s}
              </Link>
            ))}
          </nav>
        )}
      </div>

      <p aria-live="polite" className="mt-5 text-sm text-muted">
        {rows.length} {rows.length === 1 ? "listing" : "listings"}
      </p>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted">No products match these filters.</p>
      ) : (
        <>
          <div className="mt-4 hidden overflow-hidden rounded-2xl border border-border bg-surface md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">Products</caption>
              <thead className="bg-cream text-left text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Product</th>
                  <th scope="col" className="px-5 py-3 font-medium">Category</th>
                  <th scope="col" className="px-5 py-3 font-medium">Size</th>
                  <th scope="col" className="px-5 py-3 font-medium">Price</th>
                  <th scope="col" className="px-5 py-3 font-medium">Stock</th>
                  <th scope="col" className="px-5 py-3 font-medium">Status</th>
                  <th scope="col" className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((p) => (
                  <tr key={p.id} className="align-middle transition hover:bg-background">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Thumb src={p.images[0]} name={p.name} />
                        <span>
                          <Link href={`/admin/products/${p.id}`} className="font-medium hover:text-accent">
                            {p.name}
                          </Link>
                          {p.featured && <span className="block text-xs text-accent">★ Featured</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted">{p.category?.name}</td>
                    <td className="px-5 py-3">{sizeOf(p) ?? <span className="text-muted">–</span>}</td>
                    <td className="px-5 py-3">
                      <Price p={p} />
                    </td>
                    <td className="px-5 py-3">
                      <Stock variants={p.variants} />
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${p.active ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"}`}>
                        {p.active ? "Visible" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Actions p={p} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-4 space-y-3 md:hidden">
            {rows.map((p) => (
              <li key={p.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex gap-3">
                  <Thumb src={p.images[0]} name={p.name} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/products/${p.id}`} className="block truncate font-medium">
                      {p.name}
                    </Link>
                    <p className="text-xs text-muted">
                      {p.category?.name}
                      {sizeOf(p) && ` · Size ${sizeOf(p)}`}
                    </p>
                    <p className="mt-1 text-sm">
                      <Price p={p} />
                    </p>
                    <p className="mt-1 text-xs">
                      <Stock variants={p.variants} />
                    </p>
                  </div>
                  <span className={`h-fit rounded-full px-2.5 py-1 text-xs font-medium ${p.active ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"}`}>
                    {p.active ? "Visible" : "Hidden"}
                  </span>
                </div>
                <div className="mt-3 border-t border-border pt-3">
                  <Actions p={p} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
