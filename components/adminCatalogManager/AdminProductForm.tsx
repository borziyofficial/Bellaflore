// ==================================================
// SECTION: Admin Catalog Manager — product form (wizard entry)
// РАЗДЕЛ: Точка входа — мобильный мастер товара
// ==================================================
"use client";

import { AdminProductWizard } from "@/components/adminCatalogManager/AdminProductWizard";
import type { AdminProductFormState } from "@/components/adminCatalogManager/adminCatalogTypes";
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";

type AdminProductFormProps = {
  initialForm: AdminProductFormState;
  mode: "create" | "edit";
  buildPreviewRecord: (form: AdminProductFormState) => CatalogProductRecord;
  onSaveDraft: (form: AdminProductFormState) => void;
  onPublish: (form: AdminProductFormState) => void;
  onArchive?: (form: AdminProductFormState) => void;
  onCancel: () => void;
};

export function AdminProductForm(props: AdminProductFormProps) {
  return <AdminProductWizard {...props} />;
}
