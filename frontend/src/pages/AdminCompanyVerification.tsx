import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/http";
import type { ApiError } from "../api/http";

type Tab = "companies" | "trucks";

type PendingCompany = {
  id: string;
  name: string;
  rdb_number: string;
  contact_person: string;
  base_district: string;
  email: string;
  created_at: string;
};

type PendingTruck = {
  id: string;
  plate_number: string;
  truck_type: string;
  declared_capacity: number;
  company_name: string;
  company_id: string;
  reg_card_path: string | null;
  insurance_cert_path: string | null;
  created_at: string;
};

export default function AdminCompanyVerification() {
  const { user } = useAuth();
  const token = user?.token ?? "";

  const [tab, setTab] = useState<Tab>("companies");
  const [companies, setCompanies] = useState<PendingCompany[]>([]);
  const [trucks, setTrucks] = useState<PendingTruck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingTruckId, setRejectingTruckId] = useState<string | null>(null);
  const [truckRejectReason, setTruckRejectReason] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [c, t] = await Promise.all([
        apiRequest<PendingCompany[]>("/api/admin/companies/pending", { token }),
        apiRequest<PendingTruck[]>("/api/admin/trucks/pending", { token }),
      ]);
      setCompanies(c);
      setTrucks(t);
    } catch (e) {
      setError((e as ApiError).message || "Could not load data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function approveCompany(id: string) {
    try {
      await apiRequest(`/api/admin/companies/${id}/approve`, {
        method: "PATCH",
        token,
      });
      setCompanies((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      alert((e as ApiError).message || "Could not approve.");
    }
  }

  async function confirmRejectCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectingId || !rejectReason.trim()) return;
    try {
      await apiRequest(`/api/admin/companies/${rejectingId}/reject`, {
        method: "PATCH",
        token,
        body: { reason: rejectReason.trim() },
      });
      setCompanies((prev) => prev.filter((c) => c.id !== rejectingId));
      setRejectingId(null);
      setRejectReason("");
    } catch (e) {
      alert((e as ApiError).message || "Could not reject.");
    }
  }

  async function approveTruck(id: string) {
    try {
      await apiRequest(`/api/admin/trucks/${id}/approve`, {
        method: "PATCH",
        token,
      });
      setTrucks((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      alert((e as ApiError).message || "Could not approve truck.");
    }
  }

  async function confirmRejectTruck(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectingTruckId || !truckRejectReason.trim()) return;
    try {
      await apiRequest(`/api/admin/trucks/${rejectingTruckId}/reject`, {
        method: "PATCH",
        token,
        body: { reason: truckRejectReason.trim() },
      });
      setTrucks((prev) => prev.filter((t) => t.id !== rejectingTruckId));
      setRejectingTruckId(null);
      setTruckRejectReason("");
    } catch (e) {
      alert((e as ApiError).message || "Could not reject truck.");
    }
  }

  function openDoc(path: string | null | undefined) {
    if (!path) {
      alert("No document available.");
      return;
    }
    window.open(
      `http://localhost:3000/${path}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  const rejectingCompany = companies.find((c) => c.id === rejectingId) ?? null;
  const rejectingTruck = trucks.find((t) => t.id === rejectingTruckId) ?? null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 rounded-full border-2 border-sidebar border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Verification</h1>
          <p className="text-sm text-stone-600 mt-1">
            Review and approve or reject companies and trucks.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-stone-900 hover:underline"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {(["companies", "trucks"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              tab === t
                ? "bg-sidebar text-white border-sidebar"
                : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
            }`}
          >
            {t === "companies" ? "Companies" : "Trucks"}
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tab === t ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"}`}
            >
              {t === "companies" ? companies.length : trucks.length}
            </span>
          </button>
        ))}
      </div>

      {/* Companies Tab */}
      {tab === "companies" &&
        (companies.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-3xl p-10 text-center shadow-sm">
            <p className="text-stone-500 text-sm">
              No companies waiting for verification.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-stone-700">
                    Company
                  </th>
                  <th className="px-4 py-3 font-semibold text-stone-700">
                    RDB Number
                  </th>
                  <th className="px-4 py-3 font-semibold text-stone-700">
                    Contact
                  </th>
                  <th className="px-4 py-3 font-semibold text-stone-700">
                    Email
                  </th>
                  <th className="px-4 py-3 font-semibold text-stone-700">
                    Submitted
                  </th>
                  <th className="px-4 py-3 font-semibold text-stone-700 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-stone-100 last:border-0"
                  >
                    <td className="px-4 py-3 font-semibold text-stone-800">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 text-stone-700">{c.rdb_number}</td>
                    <td className="px-4 py-3 text-stone-700">
                      {c.contact_person}
                    </td>
                    <td className="px-4 py-3 text-stone-500 text-xs">
                      {c.email}
                    </td>
                    <td className="px-4 py-3 text-stone-500 text-xs">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => approveCompany(c.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent text-white hover:bg-accent-hover shadow-sm"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingId(c.id);
                            setRejectReason("");
                          }}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {/* Trucks Tab */}
      {tab === "trucks" &&
        (trucks.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-3xl p-10 text-center shadow-sm">
            <p className="text-stone-500 text-sm">
              No trucks waiting for verification.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-stone-700">
                    Plate
                  </th>
                  <th className="px-4 py-3 font-semibold text-stone-700">
                    Type
                  </th>
                  <th className="px-4 py-3 font-semibold text-stone-700">
                    Capacity
                  </th>
                  <th className="px-4 py-3 font-semibold text-stone-700">
                    Company
                  </th>
                  <th className="px-4 py-3 font-semibold text-stone-700">
                    Submitted
                  </th>
                  <th className="px-4 py-3 font-semibold text-stone-700 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {trucks.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-stone-100 last:border-0"
                  >
                    <td className="px-4 py-3 font-semibold text-stone-800 font-mono">
                      {t.plate_number}
                    </td>
                    <td className="px-4 py-3 text-stone-700">{t.truck_type}</td>
                    <td className="px-4 py-3 text-stone-700">
                      {t.declared_capacity} kg
                    </td>
                    <td className="px-4 py-3 text-stone-700">
                      {t.company_name}
                    </td>
                    <td className="px-4 py-3 text-stone-500 text-xs">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openDoc(t.reg_card_path)}
                          className="px-2 py-1 text-xs font-semibold text-sidebar bg-stone-100 rounded-lg hover:bg-stone-200"
                        >
                          Reg card
                        </button>
                        <button
                          type="button"
                          onClick={() => openDoc(t.insurance_cert_path)}
                          className="px-2 py-1 text-xs font-semibold text-sidebar bg-stone-100 rounded-lg hover:bg-stone-200"
                        >
                          Insurance cert
                        </button>
                        <button
                          type="button"
                          onClick={() => approveTruck(t.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent text-white hover:bg-accent-hover shadow-sm"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingTruckId(t.id);
                            setTruckRejectReason("");
                          }}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {/* Reject company modal */}
      {rejectingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-stone-800 mb-1">
              Reject {rejectingCompany.name}
            </h2>
            <p className="text-sm text-stone-600 mb-4">
              Provide a reason for rejection.
            </p>
            <form onSubmit={confirmRejectCompany} className="space-y-4">
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
                placeholder="e.g. Missing valid insurance documents"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRejectingId(null)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700"
                >
                  Confirm reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject truck modal */}
      {rejectingTruck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-stone-800 mb-1">
              Reject truck {rejectingTruck.plate_number}
            </h2>
            <p className="text-sm text-stone-600 mb-4">
              Company: {rejectingTruck.company_name}
            </p>
            <form onSubmit={confirmRejectTruck} className="space-y-4">
              <textarea
                rows={3}
                value={truckRejectReason}
                onChange={(e) => setTruckRejectReason(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
                placeholder="e.g. Insurance certificate is expired"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRejectingTruckId(null)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700"
                >
                  Confirm reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
