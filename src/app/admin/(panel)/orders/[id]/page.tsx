import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder, getOrderItems, STATUS_LABEL } from "@/lib/orders";
import { displayPhone, formatDateTime, ksh, waLink } from "@/lib/format";
import { IconWhatsApp } from "@/components/Icons";
import { deleteOrderAction } from "../../../actions";
import { Card, ChannelPill, PageHead, StatusPill } from "../../ui";
import { ConfirmButton } from "../../ConfirmButton";
import { OrderStatusForm } from "./OrderStatusForm";

export const metadata = { title: "Order" };

export default async function AdminOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(Number(id));
  if (!order) notFound();
  const items = await getOrderItems(order.id);
  const firstName = order.customer_name.split(" ")[0];

  return (
    <>
      <Link href="/admin/orders" className="mb-3 inline-block text-sm font-semibold text-g7 hover:underline">← All orders</Link>
      <PageHead
        title={order.ref}
        sub={`Received ${formatDateTime(order.created_at)}`}
        action={
          <div className="flex items-center gap-2">
            <ChannelPill channel={order.channel} />
            <StatusPill status={order.status} label={STATUS_LABEL[order.status]} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card>
            <h2 className="font-display text-lg font-extrabold text-g9">Items</h2>
            <ul className="mt-3 divide-y divide-line">
              {items.map((i) => (
                <li key={i.id} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    {i.product_id ? (
                      <Link href={`/admin/products/${i.product_id}`} className="font-semibold hover:text-g7">{i.product_name}</Link>
                    ) : (
                      <span className="font-semibold">{i.product_name}</span>
                    )}
                    {i.option_value && <span className="block text-sm text-muted">{i.option_value}</span>}
                    <span className="block text-sm text-muted">{i.quantity} × {ksh(i.unit_price)}</span>
                  </div>
                  <span className="font-semibold">{ksh(i.unit_price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-baseline justify-between border-t border-line pt-4">
              <span className="font-semibold">Subtotal ({order.item_count} item{order.item_count === 1 ? "" : "s"})</span>
              <span className="font-display text-2xl font-extrabold text-g9">{ksh(order.subtotal)}</span>
            </div>
            <p className="mt-1 text-sm text-muted">Prices as they were when the order was placed. Delivery not included.</p>
          </Card>

          {order.notes && (
            <Card>
              <h2 className="font-display text-lg font-extrabold text-g9">Customer&apos;s note</h2>
              <p className="mt-2 whitespace-pre-line">{order.notes}</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-[20px] bg-g9 p-5 text-white sm:p-6">
            <h2 className="font-display text-lg font-extrabold text-lime">Customer</h2>
            <dl className="mt-3 space-y-2.5">
              <div><dt className="text-xs text-mint/80">Name</dt><dd className="font-semibold">{order.customer_name}</dd></div>
              <div><dt className="text-xs text-mint/80">Phone</dt><dd className="font-semibold">{displayPhone(order.phone)}</dd></div>
              {order.email && <div><dt className="text-xs text-mint/80">Email</dt><dd className="font-semibold break-all">{order.email}</dd></div>}
              {order.location && <div><dt className="text-xs text-mint/80">Deliver to</dt><dd className="font-semibold">{order.location}</dd></div>}
            </dl>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <a href={`tel:+${order.phone}`} className="btn border-[1.5px] border-white/30 text-white hover:border-lime hover:text-lime">Call</a>
              <a
                href={waLink(order.phone, `Hello ${firstName}, this is Istilda Importers about your order ${order.ref}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-lime"
              >
                <IconWhatsApp /> WhatsApp
              </a>
            </div>
          </section>

          <Card>
            <h2 className="font-display text-lg font-extrabold text-g9">Progress</h2>
            <OrderStatusForm id={order.id} status={order.status} adminNote={order.admin_note} />
          </Card>

          <form action={deleteOrderAction} className="text-right">
            <input type="hidden" name="id" value={order.id} />
            <ConfirmButton message={`Delete order ${order.ref}? It will also disappear from your analytics.`} className="text-sm font-semibold text-danger hover:underline">
              Delete this order
            </ConfirmButton>
          </form>
        </div>
      </div>
    </>
  );
}
