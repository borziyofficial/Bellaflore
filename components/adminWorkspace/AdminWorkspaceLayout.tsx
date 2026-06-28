// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: Админ-панель
//
// Purpose (EN):
// Shared layout shell for admin workspace sections
//
// Назначение (RU):
// Общий layout админ-workspace
// ==================================================
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import type { AdminWorkspaceSection } from "@/components/adminWorkspace/adminWorkspaceTypes";

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "24px",
  background: "#f7f2ea",
  color: "#2f2a24",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const containerStyle: CSSProperties = {
  width: "min(960px, 100%)",
  margin: "0 auto",
  display: "grid",
  gap: "16px",
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(138, 107, 61, 0.18)",
  borderRadius: "8px",
  padding: "18px",
  background: "#ffffff",
};

const eyebrowStyle: CSSProperties = {
  margin: 0,
  color: "#8a6b3d",
  fontSize: "12px",
  fontWeight: 800,
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: "clamp(28px, 6vw, 42px)",
  lineHeight: 1.1,
};

const mutedStyle: CSSProperties = {
  margin: 0,
  color: "#75695c",
  lineHeight: 1.5,
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
};

const sectionLinkStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  border: "1px solid rgba(138, 107, 61, 0.22)",
  borderRadius: "8px",
  padding: "14px",
  background: "#fffaf2",
  color: "inherit",
  textDecoration: "none",
};

type AdminWorkspaceLayoutProps = {
  title: string;
  description: string;
  adminUserName: string;
  adminUserRole: string;
  children?: ReactNode;
  sections?: AdminWorkspaceSection[];
  backHref?: string;
};

export function AdminWorkspaceLayout({
  title,
  description,
  adminUserName,
  adminUserRole,
  children,
  sections,
  backHref = "/admin",
}: AdminWorkspaceLayoutProps) {
  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        {/* ==================================================
SECTION: ADMIN
РАЗДЕЛ: Заголовок страницы и ссылка назад
Purpose (EN): Page header with title and back link
Назначение (RU): Заголовок страницы и ссылка назад
================================================== */}
        <section style={cardStyle}>
          <p style={eyebrowStyle}>Bellaflore Admin Workspace Foundation</p>
          <h1 style={titleStyle}>{title}</h1>
          <p style={{ ...mutedStyle, marginTop: "12px" }}>{description}</p>
          <p style={{ ...mutedStyle, marginTop: "8px" }}>
            Тестовый пользователь: {adminUserName} ({adminUserRole})
          </p>
          {backHref ? (
            <p style={{ ...mutedStyle, marginTop: "12px" }}>
              <Link href={backHref}>← Назад в workspace</Link>
            </p>
          ) : null}
        </section>

        {sections && sections.length > 0 && (
          <section style={cardStyle}>
            {/* ==================================================
SECTION: ADMIN
РАЗДЕЛ: Ссылки доступных разделов workspace
Purpose (EN): Available workspace section links
Назначение (RU): Ссылки доступных разделов workspace
================================================== */}
            <p style={eyebrowStyle}>Доступные разделы</p>
            <div style={sectionGridStyle}>
              {sections.map((section) => (
                <Link
                  key={section.sectionId}
                  href={section.sectionPath}
                  style={sectionLinkStyle}
                >
                  <strong>{section.sectionName}</strong>
                  <span style={mutedStyle}>{section.sectionDescription}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {children}
      </div>
    </main>
  );
}

export function AdminWorkspaceDeniedPanel({
  message,
}: {
  message: string;
}) {
  return (
    <section style={{ ...cardStyle, background: "#fff1f1" }}>
      <p style={eyebrowStyle}>Access Denied</p>
      <h2 style={{ margin: "4px 0 0", fontSize: "24px" }}>Доступ запрещён</h2>
      <p style={{ ...mutedStyle, marginTop: "12px", color: "#8e2020" }}>
        {message}
      </p>
    </section>
  );
}

export function AdminWorkspacePlaceholderPanel({
  sectionName,
}: {
  sectionName: string;
}) {
  return (
    <section style={cardStyle}>
      <p style={eyebrowStyle}>Section Placeholder</p>
      <h2 style={{ margin: "4px 0 0", fontSize: "24px" }}>{sectionName}</h2>
      <p style={{ ...mutedStyle, marginTop: "12px" }}>Раздел подготовлен</p>
    </section>
  );
}
