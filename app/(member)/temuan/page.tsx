import { Suspense } from "react";
import { Temuan } from "@/components/member/screens/Temuan";

// Temuan memakai useSearchParams (?open=), butuh batas Suspense saat prerender.
export default function TemuanPage() {
  return (
    <Suspense fallback={null}>
      <Temuan />
    </Suspense>
  );
}
