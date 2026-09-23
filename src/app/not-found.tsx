import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-6 text-center dark:bg-zinc-950">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Product not found</h1>
      <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
        That product doesn&apos;t exist in this demo. Pick one from the home page instead.
      </p>
      <Link
        href="/"
        className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white dark:bg-white dark:text-zinc-900"
      >
        Back to Home
      </Link>
    </div>
  );
}
