import { notFound } from "next/navigation";
import { getProduct, PRODUCTS } from "@/lib/products";
import ProductPreviewClient from "@/components/ProductPreviewClient";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }));
}

export default async function ProductPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProduct(id);

  if (!product) {
    notFound();
  }

  return <ProductPreviewClient product={product} />;
}
