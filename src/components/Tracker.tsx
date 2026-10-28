"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { track } from "./track";

export function Tracker() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    track("pageview", { path: pathname, referrer: first.current ? document.referrer : "" });
    first.current = false;
  }, [pathname]);
  return null;
}
