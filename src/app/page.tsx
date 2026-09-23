import Link from "next/link";
import { PRODUCTS } from "@/lib/products";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          AR Placement Demo
        </h1>
        <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
          Select a product and see how it looks in your environment.
        </p>

        <div className="mt-10 flex flex-col gap-4">
          {PRODUCTS.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="flex min-h-16 w-full items-center justify-center rounded-2xl bg-zinc-900 px-6 text-lg font-semibold text-white shadow-sm transition-colors active:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:active:bg-zinc-200"
            >
              {product.name}
            </Link>
          ))}
        </div>

        <p className="mt-10 text-xs text-zinc-400 dark:text-zinc-600">
          Proof of concept — models are placeholder geometry, not final assets.
        </p>
      </div>
    </div>
  );
}
