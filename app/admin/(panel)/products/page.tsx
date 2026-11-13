import Image from "next/image";
import Link from "next/link";
import ConfirmButton from "@/components/admin/confirm-button";
import { requireAdmin } from "@/lib/admin";
import { deleteProduct, setProductActive } from "@/lib/actions/products";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Products" };

type Row = {
  id: string;
  name: string;
  price_pesewas: number;
  images: string[];
  active: boolean;
  category: { name: string } | null;
  variants: { stock: number }[];
};

export default async function ProductsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("products")
    .select("id,name,price_pesewas,images,active,category:categories(name),variants:product_variants(stock)")
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Products</h1>
        <Link href="/admin/products/new" className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90">
          + New product
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-10 text-sm text-muted">No products yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-surface">
          {rows.map((p) => {
            const stock = p.variants.reduce((n, v) => n + v.stock, 0);
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-background">
                  {p.images[0] ? (
                    <Image src={p.images[0]} alt="" fill sizes="56px" className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center font-display text-xl text-accent/30">{p.name.charAt(0)}</div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <Link href={`/admin/products/${p.id}`} className="truncate font-medium hover:text-accent">
                    {p.name}
                  </Link>
                  <p className="text-xs text-muted">
                    {p.category?.name} · {formatPrice(p.price_pesewas)} ·{" "}
                    <span className={stock === 0 ? "text-red-600" : ""}>{stock === 0 ? "Sold out" : `${stock} in stock`}</span>
                  </p>
                </div>

                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${p.active ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"}`}>
                  {p.active ? "Visible" : "Hidden"}
                </span>

                <div className="flex items-center gap-3 text-sm">
                  <Link href={`/admin/products/${p.id}`} className="text-accent hover:underline">Edit</Link>
                  <form action={setProductActive.bind(null, p.id, !p.active)}>
                    <button className="text-muted transition hover:text-foreground">{p.active ? "Hide" : "Show"}</button>
                  </form>
                  <form action={deleteProduct.bind(null, p.id)}>
                    <ConfirmButton message={`Delete "${p.name}"? This cannot be undone.`} className="text-muted transition hover:text-red-600">
                      Delete
                    </ConfirmButton>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
