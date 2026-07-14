// ==================================================
// SECTION: SHARED BOTTOM NAV PANEL VIEWPORT
// РАЗДЕЛ: Общий viewport панелей нижней навигации
// ==================================================
import type { ReactNode } from "react";
import styles from "@/components/panels/BottomNavPanelFrame.module.css";

type BottomNavPanelFrameProps = {
  children: ReactNode;
  closing?: boolean;
};

export function BottomNavPanelFrame({
  children,
  closing = false,
}: BottomNavPanelFrameProps) {
  return (
    <div
      className={`${styles.frame} ${
        closing ? "bottom-nav-panel-host-closing" : ""
      }`}
    >
      {children}
    </div>
  );
}
