import { useEffect } from "react";
import { useRouter } from "next/router";

/** Legacy route — History now lives in Progress → Training. Keeps old
 *  bookmarks and installed-PWA entry points working. */
export default function HistoryRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/progress"); }, [router]);
  return null;
}
