"use client";

import { useEffect } from "react";

type ScrollLockSnapshot = {
  scrollY: number;
  htmlOverflow: string;
  bodyOverflow: string;
  bodyPosition: string;
  bodyTop: string;
  bodyLeft: string;
  bodyRight: string;
  bodyWidth: string;
};

let activeScrollLocks = 0;
let scrollLockSnapshot: ScrollLockSnapshot | null = null;
let pendingScrollRestoreFrame: number | null = null;

function cancelPendingScrollRestore() {
  if (pendingScrollRestoreFrame === null || typeof window === "undefined") {
    return;
  }

  window.cancelAnimationFrame(pendingScrollRestoreFrame);
  pendingScrollRestoreFrame = null;
}

function acquireBodyScrollLock() {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  cancelPendingScrollRestore();

  if (activeScrollLocks === 0) {
    const { style: htmlStyle } = document.documentElement;
    const { style: bodyStyle } = document.body;

    scrollLockSnapshot = {
      scrollY: window.scrollY,
      htmlOverflow: htmlStyle.overflow,
      bodyOverflow: bodyStyle.overflow,
      bodyPosition: bodyStyle.position,
      bodyTop: bodyStyle.top,
      bodyLeft: bodyStyle.left,
      bodyRight: bodyStyle.right,
      bodyWidth: bodyStyle.width,
    };

    htmlStyle.overflow = "hidden";
    bodyStyle.overflow = "hidden";
    bodyStyle.position = "fixed";
    bodyStyle.top = `-${scrollLockSnapshot.scrollY}px`;
    bodyStyle.left = "0";
    bodyStyle.right = "0";
    bodyStyle.width = "100%";
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
    bodyStyle.overflow = snapshot.bodyOverflow;
    bodyStyle.position = snapshot.bodyPosition;
    bodyStyle.top = snapshot.bodyTop;
    bodyStyle.left = snapshot.bodyLeft;
    bodyStyle.right = snapshot.bodyRight;
    bodyStyle.width = snapshot.bodyWidth;

    pendingScrollRestoreFrame = window.requestAnimationFrame(() => {
      pendingScrollRestoreFrame = null;
      if (activeScrollLocks === 0) {
        window.scrollTo(0, snapshot.scrollY);
      }
    });
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
