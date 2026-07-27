import { useEffect } from "react";
import { useRouter } from "next/router";

/** Legacy route — Body tracking now lives in Progress → Body. Keeps old
 *  bookmarks and installed-PWA entry points working. */
export default function TrackRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/progress?section=body"); }, [router]);
  return null;
}
