"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit2, Plus, Power, RefreshCcw, Search, Trash2, X } from "lucide-react";
import { ProtectedPage } from "../../components/ProtectedPage";
import { ApiError, apiFetch } from "../../lib/api";
import { formatCurrency, formatDate } from "../../lib/format";

type PlanStage = "Trial" | "Free" | "Plus" | "Premium";
type BillingCycle = "None" | "Monthly" | "Yearly";

type PlanRow = {
  id: string;
  name: string;
  stage: PlanStage;
  price: number;
  billingCycle: BillingCycle;
  isActive: boolean;
  nextBillingAt: string | null;
};

type PlanForm = {
  name: string;
  stage: PlanStage;
  price: string;
  billingCycle: BillingCycle;
  isActive: boolean;
  nextBillingAt: string;
};

const emptyForm: PlanForm = {
  name: "",
  stage: "Free",
  price: "0",
  billingCycle: "None",
  isActive: true,
  nextBillingAt: ""
};

export default function PlansPage() {
  return (
    <ProtectedPage roles={["Admin", "Manager"]} subtitle="Catalog and billing" title="Plans">
      {() => <PlansTable />}
    </ProtectedPage>
  );
}

function PlansTable() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [query, setQuery] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanRow | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void loadPlans();
  }, []);

  const filteredPlans = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return plans.filter((plan) => {
      const matchesQuery = !normalizedQuery || [plan.name, plan.stage, plan.billingCycle, plan.isActive ? "active" : "inactive"]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
      const matchesAvailability = availabilityFilter === "All"
        || (availabilityFilter === "Active" && plan.isActive)
        || (availabilityFilter === "Inactive" && !plan.isActive);

      return matchesQuery && matchesAvailability;
    });
  }, [availabilityFilter, plans, query]);

  async function loadPlans() {
    setState("loading");

    try {
      const result = await apiFetch<PlanRow[]>("/api/plans");
      setPlans(result);
      setState("ready");
    } catch {
      setState("error");
    }
  }

  function openCreateForm() {
    setEditingPlan(null);
    setForm(emptyForm);
    setMessage(null);
    setIsFormOpen(true);
  }

  function openEditForm(plan: PlanRow) {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      stage: plan.stage,
      price: String(plan.price),
      billingCycle: plan.billingCycle,
      isActive: plan.isActive,
      nextBillingAt: toDateInputValue(plan.nextBillingAt)
    });
    setMessage(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingPlan(null);
    setForm(emptyForm);
    setMessage(null);
  }

  function updateStage(stage: PlanStage) {
    const paid = isPaidStage(stage);
    setForm({
      ...form,
      stage,
      price: paid && form.price === "0" ? "" : form.price,
      billingCycle: paid && form.billingCycle === "None" ? "Monthly" : form.billingCycle,
      nextBillingAt: paid ? form.nextBillingAt : ""
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const payload = {
        name: form.name,
        stage: form.stage,
        price: Number(form.price),
        billingCycle: form.billingCycle,
        isActive: form.isActive,
        nextBillingAt: toApiDate(form.nextBillingAt)
      };

      if (editingPlan) {
        await apiFetch<PlanRow>(`/api/plans/${editingPlan.id}`, {
          method: "PUT",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch<PlanRow>("/api/plans", {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify(payload)
        });
      }

      await loadPlans();
      closeForm();
    } catch (error) {
      setMessage(getPlanErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActive(plan: PlanRow) {
    setMessage(null);

    try {
      await apiFetch<PlanRow>(`/api/plans/${plan.id}/active`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ isActive: !plan.isActive })
      });
      await loadPlans();
    } catch (error) {
      setMessage(getPlanErrorMessage(error));
    }
  }

  async function handleDelete(plan: PlanRow) {
    setMessage(null);

    try {
      await apiFetch<void>(`/api/plans/${plan.id}`, {
        method: "DELETE"
      });
      await loadPlans();
    } catch (error) {
      setMessage(getPlanErrorMessage(error));
    }
  }

  const paidStage = isPaidStage(form.stage);

  if (state === "loading") {
    return <div className="state">Loading</div>;
  }

  if (state === "error") {
    return <div className="state state-error">Unable to load plans</div>;
  }

  return (
    <div className="plans-page">
      <div className="data-toolbar">
        <div className="data-toolbar-summary">
          <strong>{plans.length} plans</strong>
          <span>Catalog availability and recurring billing</span>
        </div>
        <div className="data-toolbar-actions">
          <label className="search-field">
            <Search aria-hidden size={17} />
            <span className="sr-only">Search plans</span>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search plans"
              type="search"
              value={query}
            />
          </label>
          <button aria-label="Refresh plans" className="icon-button" onClick={() => void loadPlans()} title="Refresh plans" type="button">
            <RefreshCcw aria-hidden size={16} />
          </button>
          <button className="button" onClick={openCreateForm} type="button">
            <Plus aria-hidden size={16} />
            <span>New plan</span>
          </button>
        </div>
      </div>

      <div className="segmented-control" aria-label="Filter plans by availability">
        {(["All", "Active", "Inactive"] as const).map((availability) => (
          <button
            aria-pressed={availabilityFilter === availability}
            className={availabilityFilter === availability ? "segmented-control-active" : ""}
            key={availability}
            onClick={() => setAvailabilityFilter(availability)}
            type="button"
          >
            {availability}
          </button>
        ))}
      </div>

      {message ? <div className="alert alert-error">{message}</div> : null}

      <div className={`plans-workspace ${isFormOpen ? "plans-workspace-panel-open" : ""}`}>
        <section className="data-table-panel" aria-label="Plan catalog">
          {plans.length === 0 ? (
            <div className="state">No plans have been created yet.</div>
          ) : filteredPlans.length === 0 ? (
            <div className="state">No plans match the current filters.</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Stage</th>
                    <th>Price</th>
                    <th>Billing cycle</th>
                    <th>Availability</th>
                    <th>Next billing</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlans.map((plan) => (
                    <tr key={plan.id}>
                      <td>
                        <div className="plan-identity">
                          <span aria-hidden className={`plan-marker plan-marker-${plan.stage.toLowerCase()}`}>{plan.stage.slice(0, 1)}</span>
                          <strong>{plan.name}</strong>
                        </div>
                      </td>
                      <td><span className={`plan-badge plan-badge-${plan.stage.toLowerCase()}`}>{plan.stage}</span></td>
                      <td><span className={plan.price === 0 ? "plan-price plan-price-free" : "plan-price"}>{plan.price === 0 ? "Free" : formatCurrency(plan.price)}</span></td>
                      <td><span className="source-label">{plan.billingCycle}</span></td>
                      <td><span className={`status-pill plan-status-${plan.isActive ? "active" : "inactive"}`}>{plan.isActive ? "Active" : "Inactive"}</span></td>
                      <td><PlanBillingDate value={plan.nextBillingAt} /></td>
                      <td>
                        <div className="row-actions">
                          <button aria-label={`${plan.isActive ? "Deactivate" : "Activate"} ${plan.name}`} className="icon-button" onClick={() => void handleToggleActive(plan)} title={plan.isActive ? "Deactivate plan" : "Activate plan"} type="button">
                            <Power aria-hidden size={16} />
                          </button>
                          <button aria-label={`Edit ${plan.name}`} className="icon-button" onClick={() => openEditForm(plan)} title="Edit plan" type="button">
                            <Edit2 aria-hidden size={16} />
                          </button>
                          <button aria-label={`Delete ${plan.name}`} className="icon-button danger-button" onClick={() => void handleDelete(plan)} title="Delete plan" type="button">
                            <Trash2 aria-hidden size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {isFormOpen ? (
          <aside className="detail-panel plan-detail-panel" aria-labelledby="plan-panel-title">
            <form onSubmit={handleSubmit}>
              <div className="detail-panel-header">
                <div>
                  <span className="dashboard-kicker">Plan configuration</span>
                  <h2 id="plan-panel-title">{editingPlan ? "Edit plan" : "New plan"}</h2>
                </div>
                <button aria-label="Close plan panel" className="icon-button" onClick={closeForm} title="Close" type="button">
                  <X aria-hidden size={16} />
                </button>
              </div>
              <div className="detail-panel-fields">
                <div className="field">
                  <label htmlFor="plan-name">Name</label>
                  <input className="input" id="plan-name" minLength={2} onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} />
                </div>
                <div className="field">
                  <label htmlFor="plan-stage">Stage</label>
                  <select className="input" id="plan-stage" onChange={(event) => updateStage(event.target.value as PlanStage)} value={form.stage}>
                    <option value="Trial">Trial</option>
                    <option value="Free">Free</option>
                    <option value="Plus">Plus</option>
                    <option value="Premium">Premium</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="plan-price">Price</label>
                  <input className="input" id="plan-price" min={0} onChange={(event) => setForm({ ...form, price: event.target.value })} required step="0.01" type="number" value={form.price} />
                </div>
                <div className="field">
                  <label htmlFor="plan-cycle">Billing cycle</label>
                  <select className="input" id="plan-cycle" onChange={(event) => setForm({ ...form, billingCycle: event.target.value as BillingCycle })} value={form.billingCycle}>
                    <option value="None">None</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="plan-billing">Next billing</label>
                  <input className="input" id="plan-billing" onChange={(event) => setForm({ ...form, nextBillingAt: event.target.value })} required={paidStage} type="date" value={form.nextBillingAt} />
                </div>
                <label className="check-field plan-active-field">
                  <input checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} type="checkbox" />
                  <span>Available to new subscriptions</span>
                </label>
              </div>
              <div className="detail-panel-actions">
                <button className="button button-secondary" onClick={closeForm} type="button">Cancel</button>
                <button className="button" disabled={isSaving} type="submit">{isSaving ? "Saving" : "Save plan"}</button>
              </div>
            </form>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function PlanBillingDate({ value }: { value: string | null }) {
  if (!value) {
    return <span className="billing-date billing-date-empty">Not scheduled</span>;
  }

  return <span className="billing-date">{formatDate(value)}</span>;
}

function isPaidStage(stage: PlanStage): boolean {
  return stage === "Plus" || stage === "Premium";
}

function toApiDate(value: string): string | null {
  return value ? `${value}T00:00:00Z` : null;
}

function toDateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

function getPlanErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return "A plan already exists for this stage.";
    }

    if (error.status === 400) {
      return "Plus and Premium plans require price, billing cycle, and next billing date.";
    }

    if (error.status === 403) {
      return "Permission denied.";
    }
  }

  return "Unable to save plan.";
}
