import type { Metadata } from "next";
import SiteHeader from "@/components/store/SiteHeader";
import AccountClient from "@/components/store/AccountClient";

export const metadata: Metadata = {
  title: "Account — LuxMeble",
};

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <AccountClient />
    </div>
  );
}
