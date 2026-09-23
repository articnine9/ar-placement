import { notFound } from "next/navigation";
import { getProduct, PRODUCTS } from "@/lib/products";
import ARPageClient from "@/components/ARPageClient";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ product: p.id }));
}

export default async function ARRoutePage({
  params,
}: {
  params: Promise<{ product: string }>;
}) {
  const { product: productId } = await params;
  const product = getProduct(productId);

  if (!product) {
    notFound();
  }

  return <ARPageClient product={product} />;
}
