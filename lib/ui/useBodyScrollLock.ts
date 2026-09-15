"use client";

import { useEffect } from "react";

type ScrollLockSnapshot = {
  htmlOverflow: string;
  htmlOverscrollBehavior: string;
  bodyOverflow: string;
  bodyOverscrollBehavior: string;
};

let activeScrollLocks = 0;
let scrollLockSnapshot: ScrollLockSnapshot | null = null;

function acquireBodyScrollLock() {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  if (activeScrollLocks === 0) {
    const { style: htmlStyle } = document.documentElement;
    const { style: bodyStyle } = document.body;

    scrollLockSnapshot = {
      htmlOverflow: htmlStyle.overflow,
      htmlOverscrollBehavior: htmlStyle.overscrollBehavior,
      bodyOverflow: bodyStyle.overflow,
      bodyOverscrollBehavior: bodyStyle.overscrollBehavior,
    };

    // Keep the document in normal flow. iOS Safari can become unstable when a
    // modal unmount races with history changes while body is position:fixed
    // and translated using a negative top value. Overflow locking avoids that
    // layout/history race without disabling touch scrolling inside the modal.
    htmlStyle.overflow = "hidden";
    htmlStyle.overscrollBehavior = "none";
    bodyStyle.overflow = "hidden";
    bodyStyle.overscrollBehavior = "none";
  }

  activeScrollLocks += 1;
  let released = false;

  return () => {
    if (released || typeof window === "undefined") {
      return;
    }

    released = true;
    activeScrollLocks = Math.max(0, activeScrollLocks - 1);

    if (activeScrollLocks > 0 || !scrollLockSnapshot) {
      return;
    }

    const snapshot = scrollLockSnapshot;
    scrollLockSnapshot = null;

    const { style: htmlStyle } = document.documentElement;
    const { style: bodyStyle } = document.body;

    htmlStyle.overflow = snapshot.htmlOverflow;
    htmlStyle.overscrollBehavior = snapshot.htmlOverscrollBehavior;
    bodyStyle.overflow = snapshot.bodyOverflow;
    bodyStyle.overscrollBehavior = snapshot.bodyOverscrollBehavior;
  };
}

export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) {
      return;
    }

    return acquireBodyScrollLock();
  }, [active]);
}
