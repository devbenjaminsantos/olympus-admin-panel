"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  CircleAlert,
  Clock3,
  CreditCard,
  ReceiptText,
  UsersRound
} from "lucide-react";
import { ProtectedPage } from "../../components/ProtectedPage";
import { apiFetch } from "../../lib/api";
import { formatCurrency, formatDate } from "../../lib/format";
import { canAccess, navItems } from "../../lib/navigation";
import type { UserProfile } from "../../lib/types";

type ClientStatus = "Active" | "Inactive" | "Suspended";
type PlanStage = "Trial" | "Free" | "Plus" | "Premium";
type OrderStatus = "Pending" | "Processing" | "Completed" | "Cancelled";

type Client = {
  id: string;
  name: string;
  status: ClientStatus;
  planStage: PlanStage;
  nextBillingAt: string | null;
};

type Plan = { id: string; isActive: boolean };

type Order = {
  id: string;
  clientId: string;
  planStage: PlanStage;
  status: OrderStatus;
  finalAmount: number;
  createdAt: string;
  updatedAt: string;
};

type User = { id: string; status: "Active" | "Inactive" };

type DashboardData = {
  users: User[];
  clients: Client[];
  plans: Plan[];
  orders: Order[];
};

export default function DashboardPage() {
  return (
    <ProtectedPage
      roles={["Admin", "Manager", "Support", "Viewer"]}
      subtitle="Operational overview"
      title="Dashboard"
    >
      {(user) => <DashboardContent user={user} />}
    </ProtectedPage>
  );
}

function DashboardContent({ user }: { user: UserProfile }) {
  const [data, setData] = useState<DashboardData>({ users: [], clients: [], plans: [], orders: [] });
  const [state, setState] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    setState("loading");

    const results = await Promise.allSettled([
      apiFetch<User[]>("/api/users"),
      apiFetch<Client[]>("/api/clients"),
      apiFetch<Plan[]>("/api/plans"),
      apiFetch<Order[]>("/api/orders")
    ]);

    setData({
      users: getValue(results[0]),
      clients: getValue(results[1]),
      plans: getValue(results[2]),
      orders: getValue(results[3])
    });
    setState("ready");
  }

  if (state === "loading") {
    return <div className="state">Loading operational data</div>;
  }

  const now = Date.now();
  const activeClients = data.clients.filter((client) => client.status === "Active");
  const activePlans = data.plans.filter((plan) => plan.isActive);
  const completedRevenue = data.orders
    .filter((order) => order.status === "Completed")
    .reduce((total, order) => total + order.finalAmount, 0);
  const openOrders = data.orders.filter((order) => order.status === "Pending" || order.status === "Processing");
  const overdueBilling = activeClients.filter((client) => isBeforeToday(client.nextBillingAt, now));
  const upcomingBilling = activeClients.filter((client) => isDueSoon(client.nextBillingAt, now));
  const clientById = new Map(data.clients.map((client) => [client.id, client]));
  const recentOrders = [...data.orders]
    .sort((first, second) => toTimestamp(second.updatedAt) - toTimestamp(first.updatedAt))
    .slice(0, 5);
  const planDistribution = (["Trial", "Free", "Plus", "Premium"] as const).map((stage) => ({
    stage,
    count: activeClients.filter((client) => client.planStage === stage).length
  }));
  const largestPlanCount = Math.max(...planDistribution.map((item) => item.count), 1);
  const canViewClients = canAccess(user.role, navItems[2]);
  const canViewOrders = canAccess(user.role, navItems[4]);

  return (
    <div className="dashboard-layout">
      <section className="dashboard-overview" aria-labelledby="operations-snapshot">
        <div className="dashboard-section-heading">
          <div>
            <span className="dashboard-kicker">Live workspace</span>
            <h2 id="operations-snapshot">Operations snapshot</h2>
          </div>
          <button className="button button-secondary dashboard-refresh" onClick={() => void loadDashboard()} type="button">
            <Activity aria-hidden size={16} />
            <span>Refresh</span>
          </button>
        </div>
        <div className="dashboard-metrics">
          <Metric icon={UsersRound} label="Active clients" value={activeClients.length.toString()} detail={`${data.clients.length} total records`} />
          <Metric icon={CreditCard} label="Active plans" value={activePlans.length.toString()} detail={`${data.plans.length} configured`} />
          <Metric icon={ReceiptText} label="Open orders" value={openOrders.length.toString()} detail={`${data.orders.length} total orders`} tone={openOrders.length > 0 ? "warning" : "default"} />
          <Metric icon={Activity} label="Completed revenue" value={formatCurrency(completedRevenue)} detail="Completed orders only" tone="success" />
        </div>
      </section>

      <div className="dashboard-workspace">
        <section className="dashboard-panel dashboard-attention" aria-labelledby="attention-title">
          <div className="dashboard-panel-heading">
            <div>
              <span className="dashboard-kicker">Priority queue</span>
              <h2 id="attention-title">Requires attention</h2>
            </div>
            <CircleAlert aria-hidden className="attention-icon" size={20} />
          </div>
          <div className="attention-list">
            <AttentionItem
              count={overdueBilling.length}
              description="Active subscriptions with a past billing date"
              href={canViewClients ? "/clients" : undefined}
              label="Overdue billing"
              tone={overdueBilling.length > 0 ? "danger" : "neutral"}
            />
            <AttentionItem
              count={upcomingBilling.length}
              description="Billing dates arriving in the next seven days"
              href={canViewClients ? "/clients" : undefined}
              label="Upcoming billing"
              tone={upcomingBilling.length > 0 ? "warning" : "neutral"}
            />
            <AttentionItem
              count={openOrders.length}
              description="Orders waiting for resolution or completion"
              href={canViewOrders ? "/orders" : undefined}
              label="Open orders"
              tone={openOrders.length > 0 ? "warning" : "neutral"}
            />
          </div>
        </section>

        <section className="dashboard-panel dashboard-orders" aria-labelledby="recent-orders-title">
          <div className="dashboard-panel-heading">
            <div>
              <span className="dashboard-kicker">Order activity</span>
              <h2 id="recent-orders-title">Recent orders</h2>
            </div>
            {canViewOrders ? (
              <Link className="dashboard-text-link" href="/orders">View orders <ArrowUpRight aria-hidden size={14} /></Link>
            ) : null}
          </div>
          {recentOrders.length === 0 ? (
            <div className="dashboard-empty">No orders have been recorded yet.</div>
          ) : (
            <div className="recent-orders-list">
              {recentOrders.map((order) => (
                <div className="recent-order" key={order.id}>
                  <div className="recent-order-main">
                    <strong>{clientById.get(order.clientId)?.name ?? "Client unavailable"}</strong>
                    <span>{order.planStage} plan · {formatDate(order.updatedAt)}</span>
                  </div>
                  <div className="recent-order-meta">
                    <span className={`status-pill status-${order.status.toLowerCase()}`}>{order.status}</span>
                    <strong>{formatCurrency(order.finalAmount)}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="dashboard-panel dashboard-distribution" aria-labelledby="subscription-title">
        <div className="dashboard-panel-heading">
          <div>
            <span className="dashboard-kicker">Client base</span>
            <h2 id="subscription-title">Subscription distribution</h2>
          </div>
          <Clock3 aria-hidden className="dashboard-panel-icon" size={19} />
        </div>
        <div className="distribution-list">
          {planDistribution.map((item) => (
            <div className="distribution-row" key={item.stage}>
              <span>{item.stage}</span>
              <div aria-label={`${item.stage}: ${item.count} clients`} className="distribution-track" role="img">
                <span style={{ width: `${(item.count / largestPlanCount) * 100}%` }} />
              </div>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
  tone = "default"
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  detail: string;
  tone?: "default" | "success" | "warning";
}) {
  return (
    <article className={`dashboard-metric dashboard-metric-${tone}`}>
      <div className="dashboard-metric-top">
        <span>{label}</span>
        <Icon aria-hidden size={17} />
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function AttentionItem({
  count,
  description,
  href,
  label,
  tone
}: {
  count: number;
  description: string;
  href?: string;
  label: string;
  tone: "danger" | "warning" | "neutral";
}) {
  const content = (
    <>
      <span className={`attention-count attention-count-${tone}`}>{count}</span>
      <span className="attention-copy">
        <strong>{label}</strong>
        <span>{description}</span>
      </span>
      <ArrowUpRight aria-hidden className="attention-arrow" size={17} />
    </>
  );

  return href ? (
    <Link className="attention-item" href={href}>{content}</Link>
  ) : (
    <div className="attention-item attention-item-static">{content}</div>
  );
}

function getValue<T>(result: PromiseSettledResult<T>): T {
  return result.status === "fulfilled" ? result.value : ([] as T);
}

function toTimestamp(value: string): number {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function isBeforeToday(value: string | null, now: number): boolean {
  const timestamp = value ? Date.parse(value) : Number.NaN;
  return !Number.isNaN(timestamp) && timestamp < startOfToday(now);
}

function isDueSoon(value: string | null, now: number): boolean {
  const timestamp = value ? Date.parse(value) : Number.NaN;
  const start = startOfToday(now);
  const end = start + (7 * 24 * 60 * 60 * 1000);
  return !Number.isNaN(timestamp) && timestamp >= start && timestamp <= end;
}

function startOfToday(now: number): number {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return today.getTime();
}
