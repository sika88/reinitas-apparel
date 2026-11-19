import Link from "next/link";
import ActionButton from "@/components/admin/action-button";
import CategoryForm from "@/components/admin/category-form";
import PageHeader from "@/components/admin/page-header";
import RenameCategory from "@/components/admin/rename-category";
import { requireAdmin } from "@/lib/admin";
import { deleteCategory, hideEmptyCategories, moveCategory, setCategoryVisible } from "@/lib/actions/categories";
import { SIZE_TYPE_LABEL } from "@/lib/sizes";
import type { SizeType } from "@/lib/types";

export const metadata = { title: "Categories" };

type Cat = { id: string; name: string; slug: string; size_type: SizeType; visible: boolean | null };

const btn =
  "inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-surface px-4 text-sm font-medium transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-40";
const arrow = `${btn} !px-0 w-10`;

export default async function CategoriesPage() {
  const { supabase } = await requireAdmin();
  const [{ data: catData, error }, { data: prodData }] = await Promise.all([
    supabase.from("categories").select("id,name,slug,size_type,visible").order("sort_order").order("name"),
    supabase.from("products").select("category_id,active"),
  ]);
  const cats = (catData ?? []) as Cat[];

  const stats = new Map<string, { total: number; visible: number }>();
  for (const p of (prodData ?? []) as { category_id: string; active: boolean }[]) {
    const s = stats.get(p.category_id) ?? { total: 0, visible: 0 };
    s.total += 1;
    if (p.active) s.visible += 1;
    stats.set(p.category_id, s);
  }
  const statOf = (id: string) => stats.get(id) ?? { total: 0, visible: 0 };
  const shown = (c: Cat) => c.visible !== false;
  const emptyShown = cats.filter((c) => shown(c) && statOf(c.id).visible === 0);

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Categories"
        description="Group your products. Customers see the shown categories in the shop menu, on the home page and in the footer."
        back={{ href: "/admin/products", label: "Products" }}
      />

      {error && (
        <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Hiding and showing categories isn’t available yet. Run the database update first, then reload this page.
        </p>
      )}

      {emptyShown.length > 0 && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-900">
          <p className="max-w-xl text-sm">
            <strong>
              {emptyShown.length} {emptyShown.length === 1 ? "category has" : "categories have"} no visible products
            </strong>{" "}
            but {emptyShown.length === 1 ? "is" : "are"} still in your shop menu: {emptyShown.map((c) => c.name).join(", ")}.
          </p>
          <ActionButton
            action={hideEmptyCategories}
            className="inline-flex min-h-11 items-center rounded-full bg-amber-900 px-6 text-sm font-medium text-white transition hover:bg-amber-950 disabled:opacity-50"
          >
            Hide empty categories
          </ActionButton>
        </section>
      )}

      <CategoryForm />

      <section aria-labelledby="your-categories">
        <h2 id="your-categories" className="mb-3 font-display text-2xl font-medium">
          Your categories
        </h2>

        {cats.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted">No categories yet. Add your first one above.</p>
        ) : (
          <ol className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {cats.map((c, i) => {
              const s = statOf(c.id);
              const isShown = shown(c);
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-x-5 gap-y-3 p-4 sm:p-5">
                  <div className="min-w-0 flex-1 basis-64">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-2xl font-medium leading-tight">{c.name}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isShown ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"}`}>
                        {isShown ? "Shown in shop" : "Hidden"}
                      </span>
                      {s.visible === 0 && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">No visible products</span>}
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {SIZE_TYPE_LABEL[c.size_type]} ·{" "}
                      <Link href={`/admin/products?category=${c.slug}`} className="underline underline-offset-4 transition hover:text-foreground">
                        {s.visible} visible, {s.total} total
                      </Link>
                    </p>
                    {!isShown && s.visible > 0 && (
                      <p className="mt-1 text-xs text-amber-700">Hidden from the menu, but its {s.visible} {s.visible === 1 ? "product still appears" : "products still appear"} under All products.</p>
                    )}
                    <div className="mt-2">
                      <RenameCategory id={c.id} name={c.name} />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {i === 0 ? (
                      <button type="button" disabled className={arrow}>
                        <span aria-hidden="true">↑</span>
                        <span className="sr-only">Move {c.name} up (already first)</span>
                      </button>
                    ) : (
                      <ActionButton action={moveCategory.bind(null, c.id, "up")} className={arrow} pendingLabel="…">
                        <span aria-hidden="true">↑</span>
                        <span className="sr-only">Move {c.name} up</span>
                      </ActionButton>
                    )}
                    {i === cats.length - 1 ? (
                      <button type="button" disabled className={arrow}>
                        <span aria-hidden="true">↓</span>
                        <span className="sr-only">Move {c.name} down (already last)</span>
                      </button>
                    ) : (
                      <ActionButton action={moveCategory.bind(null, c.id, "down")} className={arrow} pendingLabel="…">
                        <span aria-hidden="true">↓</span>
                        <span className="sr-only">Move {c.name} down</span>
                      </ActionButton>
                    )}

                    <ActionButton
                      action={setCategoryVisible.bind(null, c.id, !isShown)}
                      successMessage={isShown ? `${c.name} hidden from the shop` : `${c.name} is now shown in the shop`}
                      className={btn}
                    >
                      {isShown ? "Hide" : "Show"}
                      <span className="sr-only"> {c.name}</span>
                    </ActionButton>

                    {s.total > 0 ? (
                      <button type="button" disabled title="Move or delete its products first" className={btn}>
                        Delete<span className="sr-only"> {c.name} (it still has products)</span>
                      </button>
                    ) : (
                      <ActionButton
                        action={deleteCategory.bind(null, c.id)}
                        confirm={`Delete the category "${c.name}"? This cannot be undone.`}
                        successMessage="Category deleted"
                        className={`${btn} text-red-700 hover:border-red-300`}
                      >
                        Delete<span className="sr-only"> {c.name}</span>
                      </ActionButton>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        <p className="mt-3 text-xs text-muted">The order here is the order in the shop menu. A category can only be deleted once it has no products.</p>
      </section>
    </div>
  );
}
