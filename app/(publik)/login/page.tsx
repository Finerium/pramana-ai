import { Suspense } from "react";
import { Login } from "@/components/member/screens/Login";

// Login memakai useSearchParams (?as=), butuh batas Suspense saat prerender.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <Login />
    </Suspense>
  );
}
