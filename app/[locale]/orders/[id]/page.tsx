import SiteHeader from "@/components/store/SiteHeader";
import OrderTracking from "@/components/store/OrderTracking";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <OrderTracking orderId={id} />
    </div>
  );
}
