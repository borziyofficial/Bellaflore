// Admin routes keep Pearl day theme — isolated from storefront dark-luxury CSS.

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div data-admin-route="true">{children}</div>;
}
