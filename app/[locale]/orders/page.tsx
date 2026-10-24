import type { Metadata } from "next";
import SiteHeader from "@/components/store/SiteHeader";
import OrdersList from "@/components/store/OrdersList";

export const metadata: Metadata = {
  title: "Orders & Tracking — LuxMeble",
  description: "Track your LuxMeble orders from our atelier to your door.",
};

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <OrdersList />
    </div>
  );
}
