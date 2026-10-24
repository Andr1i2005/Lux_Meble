"use client";

// Orders access — Firebase Realtime Database only. There is no localStorage /
// guest fallback: reading and placing orders requires a signed-in user.
//
// RTDB layout:  orders/{uid}/{orderId} -> Order
// Keying by uid isolates each user's orders and keeps the security rules trivial
// (a user can only read/write under their own uid). Reads stream via onValue.

import { useEffect, useState } from "react";
import { ref, onValue, set, update, get } from "firebase/database";
import type { User } from "firebase/auth";
import { db } from "./firebase";
import {
  initialStageFields,
  advanceStageFields,
  resetStageFields,
} from "./order-tracking";
import { useAuth } from "@/components/store/AuthProvider";
import {
  newOrderId,
  newTrackingNumber,
  randomCarrier,
  type Order,
  type OrderDraft,
} from "./order-model";

// When enabled, order writes go through the trusted server (Admin SDK) route
// instead of writing to RTDB directly from the client. Reads stay realtime
// either way. See app/api/orders + lib/firebase-admin.ts.
const SERVER_ORDERS = process.env.NEXT_PUBLIC_USE_SERVER_ORDERS === "1";

/** Authenticated call to an /api/orders route using the user's Firebase ID token. */
async function authedFetch<T>(
  user: User,
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const token = await user.getIdToken();
  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error(
      (msg as { error?: string }).error ?? `Request failed (${res.status})`,
    );
  }
  return res.json() as Promise<T>;
}

// RTDB rejects `undefined` values, so strip them (e.g. an item without a
// thumbnail) before writing. JSON round-trip drops undefined properties.
function stripUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

async function placeOrderRTDB(uid: string, draft: OrderDraft): Promise<Order> {
  const createdAt = Date.now();
  const order: Order = {
    ...draft,
    id: newOrderId(),
    createdAt,
    carrier: randomCarrier(),
    trackingNumber: newTrackingNumber(),
    ...initialStageFields(createdAt),
  };
  await set(ref(db!, `orders/${uid}/${order.id}`), stripUndefined(order));
  return order;
}

/** The current user's orders (realtime). Empty when signed out. */
export function useOrders(): { orders: Order[]; loading: boolean } {
  const { user, enabled, ready } = useAuth();
  const [remote, setRemote] = useState<Order[] | null>(null);

  const active = Boolean(enabled && user && db);

  useEffect(() => {
    if (!active) return; // signed out → nothing to subscribe to
    const unsub = onValue(
      ref(db!, `orders/${user!.uid}`),
      (snap) => {
        const val = (snap.val() ?? {}) as Record<string, Order>;
        setRemote(Object.values(val).sort((a, b) => b.createdAt - a.createdAt));
      },
      // On error (e.g. permission denied) resolve to empty so loading ends.
      () => setRemote([]),
    );
    return unsub;
  }, [active, user]);

  if (!active) return { orders: [], loading: !ready };
  return { orders: remote ?? [], loading: remote === null };
}

/** A single order (realtime). Undefined when missing or signed out. */
export function useOrder(id: string): {
  order: Order | undefined;
  loading: boolean;
} {
  const { user, enabled, ready } = useAuth();
  const [remote, setRemote] = useState<Order | null | undefined>(undefined);

  const active = Boolean(enabled && user && db);

  useEffect(() => {
    if (!active) return; // signed out → nothing to subscribe to
    const unsub = onValue(
      ref(db!, `orders/${user!.uid}/${id.toUpperCase()}`),
      (snap) => setRemote(snap.exists() ? (snap.val() as Order) : null),
      () => setRemote(null),
    );
    return unsub;
  }, [active, user, id]);

  if (!active) return { order: undefined, loading: !ready };
  return { order: remote ?? undefined, loading: remote === undefined };
}

/** Create / advance / reset — RTDB directly, or via the server route when enabled. */
export function useOrderActions() {
  const { user, enabled } = useAuth();

  const active = Boolean(enabled && user && db);
  const useServer = active && SERVER_ORDERS;

  return {
    ready: active,
    placeOrder: async (draft: OrderDraft): Promise<Order> => {
      if (!active) throw new Error("You must be signed in to place an order.");
      if (useServer) {
        const { order } = await authedFetch<{ order: Order }>(
          user!,
          "/api/orders",
          "POST",
          draft,
        );
        return order;
      }
      return placeOrderRTDB(user!.uid, draft);
    },
    // Move the shipment to its next stage (writes the persisted status).
    advance: async (id: string) => {
      if (!active) return;
      if (useServer) {
        await authedFetch(user!, `/api/orders/${id.toUpperCase()}`, "PATCH", {
          action: "advance",
        });
      } else {
        const orderRef = ref(db!, `orders/${user!.uid}/${id.toUpperCase()}`);
        const snap = await get(orderRef);
        if (!snap.exists()) return;
        await update(
          orderRef,
          advanceStageFields(snap.val() as Order, Date.now()),
        );
      }
    },
    reset: async (id: string) => {
      if (!active) return;
      if (useServer) {
        await authedFetch(user!, `/api/orders/${id.toUpperCase()}`, "PATCH", {
          action: "reset",
        });
      } else {
        const orderRef = ref(db!, `orders/${user!.uid}/${id.toUpperCase()}`);
        const snap = await get(orderRef);
        if (!snap.exists()) return;
        await update(
          orderRef,
          resetStageFields(snap.val() as Order, Date.now()),
        );
      }
    },
  };
}
