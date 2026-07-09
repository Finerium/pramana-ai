import { DetailClient } from "@/components/gov/DetailClient";

export default async function KoperasiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DetailClient id={id} />;
}
