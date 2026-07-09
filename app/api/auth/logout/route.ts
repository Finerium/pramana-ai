import { clearSessionCookie } from "../../../../lib/auth";
import { ok, runRoute } from "../../../../lib/api";

export async function POST() {
  return runRoute(async () => {
    const res = ok({ loggedOut: true });
    clearSessionCookie(res);
    return res;
  });
}
