import type { Metadata } from "next";
import { CustomerOrders } from "@/components/customer-orders";
export const metadata: Metadata = { title: "Your Orders", robots: { index: false, follow: false } };
export default function OrdersPage() { return <CustomerOrders/>; }
