"use client";

import { usePathname } from "next/navigation";
import LangPreferenceModal from "./LangPreferenceModal";
import PromoPopup from "./PromoPopup";

export default function SiteShell({
  children,
  navbar,
  footer,
}: {
  children: React.ReactNode;
  navbar: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin  = pathname?.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      {navbar}
      <main className="flex-1">{children}</main>
      {footer}
      <LangPreferenceModal />
      <PromoPopup />
    </>
  );
}
