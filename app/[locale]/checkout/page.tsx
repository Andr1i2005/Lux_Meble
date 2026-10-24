import type { Metadata } from "next";
import SiteHeader from "@/components/store/SiteHeader";
import CheckoutClient from "@/components/store/CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout — LuxMeble",
};

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <CheckoutClient />
    </div>
  );
}
