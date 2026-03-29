import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/http";
import type { ApiError } from "../api/http";

type Payment = {
  id: string;
  amount: string;
  status: "PENDING" | "CONFIRMED" | "RELEASED" | "REFUNDED" | "FAILED";
  created_at: string;
  provider_reference: string;
  pickup_district: string;
  dropoff_district: string;
};

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  RELEASED: "bg-blue-100 text-blue-700",
  REFUNDED: "bg-amber-100 text-amber-700",
  PENDING: "bg-stone-100 text-stone-600",
  FAILED: "bg-red-100 text-red-700",
};

export default function PaymentsHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const token =
    user?.token ||
    (() => {
      try {
        return (
          JSON.parse(localStorage.getItem("loadlink_shipper") ?? "{}")?.token ??
          ""
        );
      } catch {
        return "";
      }
    })();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiRequest<Payment[]>("/api/shippers/payments", {
          token,
        });
        setPayments(data);
      } catch (e) {
        setError((e as ApiError).message || "Could not load payments.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 rounded-full border-2 border-sidebar border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 ll-animate-in">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Payments</h1>
        <p className="text-sm text-stone-600 mt-1">
          History of all escrow payments made.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {payments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-10 text-center shadow-sm">
          <p className="text-stone-500 mb-4">No payments yet.</p>
          <button
            type="button"
            onClick={() => navigate("/loads")}
            className="px-5 py-2.5 bg-accent text-sidebar font-semibold rounded-2xl hover:bg-accent-hover transition-all text-sm"
          >
            Go to My Shipments
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-stone-700">
                  Route
                </th>
                <th className="px-4 py-3 font-semibold text-stone-700">
                  Amount (RWF)
                </th>
                <th className="px-4 py-3 font-semibold text-stone-700">
                  Reference
                </th>
                <th className="px-4 py-3 font-semibold text-stone-700">Date</th>
                <th className="px-4 py-3 font-semibold text-stone-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-stone-800">
                    {p.pickup_district} → {p.dropoff_district}
                  </td>
                  <td className="px-4 py-3 font-bold text-stone-900">
                    {Number(p.amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-stone-500 text-xs font-mono">
                    {p.provider_reference.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3 text-stone-500 text-xs">
                    {new Date(p.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[p.status] ?? "bg-stone-100 text-stone-600"}`}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
