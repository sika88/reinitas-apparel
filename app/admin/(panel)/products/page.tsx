import Image from "next/image";
import Link from "next/link";
import ActionButton from "@/components/admin/action-button";
import PageHeader from "@/components/admin/page-header";
import RowMenu from "@/components/admin/row-menu";
import { requireAdmin } from "@/lib/admin";
import { deleteProduct, setProductActive } from "@/lib/actions/products";
import { formatPrice, sortSizes } from "@/lib/format";
import { discountedPrice } from "@/lib/pricing";

export const metadata = { title: "Products" };

const PAGE_SIZE = 30;

type Search = { q?: string; status?: string; category?: string; size?: string; page?: string };
type Row = {
  id: string;
  name: string;
  price_pesewas: number;
  discount_percent: number | null;
  images: string[];
  active: boolean;
  featured: boolean;
  category: { name: string; size_type: string } | null;
  variants: { size: string; stock: number }[];
};

const sizeOf = (p: Row) => {
  const s = p.variants[0]?.size;
  return s && s !== "One size" ? s : null;
};

const editBtn =
  "inline-flex min-h-10 items-center rounded-full border border-border bg-surface px-5 text-sm font-medium transition hover:border-accent";
const menuItem = "block w-full px-4 py-2.5 text-left text-sm transition hover:bg-cream disabled:opacity-50";

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
  if (!p.discount_percent) return <span className="font-medium">{formatPrice(p.price_pesewas)}</span>;
  return (
    <span>
      <span className="font-medium text-accent">{formatPrice(discountedPrice(p.price_pesewas, p.discount_percent))}</span>{" "}
      <s className="text-xs text-muted">{formatPrice(p.price_pesewas)}</s>{" "}
      <span className="rounded-full bg-gold/30 px-1.5 py-0.5 text-[11px] font-medium text-accent-dark">−{p.discount_percent}%</span>
    </span>
  );
}

function Stock({ variants }: { variants: Row["variants"] }) {
  const total = (Array.isArray(variants) ? variants : []).reduce((n, v) => n + v.stock, 0);
  return <span className={total === 0 ? "font-medium text-red-600" : "font-medium"}>{total === 0 ? "Sold out" : `${total} in stock`}</span>;
}

function ProductRow({ p }: { p: Row }) {
  const size = sizeOf(p);
  const sized = p.category?.size_type !== "none";

  return (
    <li className="flex flex-wrap items-center gap-x-5 gap-y-3 p-4 sm:p-5">
      <div className="flex min-w-0 flex-1 basis-64 items-center gap-4">
        <Thumb src={p.images[0]} name={p.name} />
        <div className="min-w-0">
          <Link href={`/admin/products/${p.id}`} className="line-clamp-2 font-medium leading-snug transition hover:text-accent">
            {p.name}
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span>{p.category?.name}</span>
            {size && <span className="rounded-full border border-border bg-background px-2 py-0.5 font-medium text-foreground">Size {size}</span>}
            <span className={`rounded-full px-2 py-0.5 font-medium ${p.active ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"}`}>
              {p.active ? "Visible" : "Hidden"}
            </span>
            {p.featured && <span className="text-accent">★ Featured</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-7 text-sm">
        <div className="min-w-24">
          <p className="mb-0.5 text-xs text-muted">Price</p>
          <Price p={p} />
        </div>
        <div className="min-w-20">
          <p className="mb-0.5 text-xs text-muted">Stock</p>
          <Stock variants={p.variants} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link href={`/admin/products/${p.id}`} className={editBtn}>
          Edit<span className="sr-only"> {p.name}</span>
        </Link>
        <RowMenu label={`More actions for ${p.name}`}>
          <Link role="menuitem" href={`/admin/products/new?from=${p.id}`} className={menuItem}>
            {sized ? "Add another size" : "Duplicate"}
          </Link>
          <ActionButton
            role="menuitem"
            action={setProductActive.bind(null, p.id, !p.active)}
            successMessage={p.active ? "Product hidden from the shop" : "Product is now visible"}
            className={menuItem}
          >
            {p.active ? "Hide from the shop" : "Show in the shop"}
          </ActionButton>
          <ActionButton
            role="menuitem"
            action={deleteProduct.bind(null, p.id)}
            confirm={`Delete "${p.name}"${size ? ` (size ${size})` : ""}? This cannot be undone.`}
            successMessage="Product deleted"
            className={`${menuItem} text-red-700 hover:bg-red-50`}
          >
            Delete
          </ActionButton>
        </RowMenu>
      </div>
    </li>
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
    .select("id,name,price_pesewas,discount_percent,images,active,featured,category:categories(name,size_type),variants:product_variants(size,stock)")
    .order("created_at", { ascending: false });
  if (q) query = query.ilike("name", `%${q}%`);
  if (status === "visible") query = query.eq("active", true);
  if (status === "hidden") query = query.eq("active", false);
  if (activeCat) query = query.eq("category_id", activeCat.id);

  const { data } = await query;
  const all = (data ?? []) as unknown as Row[];

  const sizes = sortSizes([...new Set(all.map(sizeOf).filter((s): s is string => Boolean(s)))].map((size) => ({ size }))).map((s) => s.size);
  const activeSize = sp.size && sizes.includes(sp.size) ? sp.size : undefined;
  const rows = activeSize ? all.filter((p) => sizeOf(p) === activeSize) : all;

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
        description="Each listing is one item in one size. Use the ⋯ menu to post the same item in another size."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/categories" className="btn-outline">
              Categories
            </Link>
            <Link href="/admin/products/new" className="btn-primary">
              + New product
            </Link>
          </div>
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
        <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface">
          {pageRows.map((p) => (
            <ProductRow key={p.id} p={p} />
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={href({ page: page > 2 ? String(page - 1) : undefined })} className="btn-outline">
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={href({ page: String(page + 1) })} className="btn-outline">
              Next →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
