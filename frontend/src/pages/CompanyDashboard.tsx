import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getTrucksByCompany,
  getAllLoads,
  ensureSeedLoads,
} from "../data/storage";
import CompanyFleetMap from "../components/CompanyFleetMap";
import type { LatLngExpression } from "leaflet";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  getActiveShipments,
  getAvailableShipments,
  getMyTrucks,
} from "../api/companyOpsApi";
import type { ApiError } from "../api/http";
import { getApiToken } from "../auth/mockJwt";
import { getCompanyByEmailDemo } from "../data/storage";

export default function CompanyDashboard() {
  const { user, updateUser } = useAuth();
  const companyName = user?.name ?? "";
  const apiToken = getApiToken(user?.token ?? null);
  const companyEmail = user?.email ?? null;
  const [refresh, setRefresh] = useState(0);
  const [showFleetMap, setShowFleetMap] = useState(false);
  const [tick, setTick] = useState(0);
  const [apiSummary, setApiSummary] = useState<{
    trucks: any[];
    openShipments: any[];
    activeShipments: any[];
  }>({
    trucks: [],
    openShipments: [],
    activeShipments: [],
  });
  const [apiError, setApiError] = useState<string | null>(null);
  const [approvalNotice, setApprovalNotice] = useState<string | null>(null);

  const demoFleet = [
    { id: "T1", position: [-1.95, 30.06] as [number, number] },
    { id: "T2", position: [-1.7, 29.26] as [number, number] },
    { id: "T3", position: [-2.6, 29.73] as [number, number] },
  ];

  const demoRoute: LatLngExpression[] = [
    [-1.9536, 30.0605], // Kigali
    [-1.89, 30.02],
    [-1.82, 29.88],
    [-1.76, 29.65],
    [-1.7, 29.26], // Gisenyi-ish
    [-1.74, 29.4],
    [-1.86, 29.75],
    [-1.99, 30.02],
  ];

  useEffect(() => {
    const id = window.setInterval(() => setTick((v) => v + 1), 1200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    // Sync company status from local storage (demo).
    if (!companyEmail) return;
    const c = getCompanyByEmailDemo(companyEmail);
    if (!c) return;
    const nextStatus = String(c.status ?? "").toUpperCase();
    const currentStatus = String(user?.status ?? "").toUpperCase();
    if (nextStatus && nextStatus !== currentStatus) {
      updateUser({ status: nextStatus });
    }

    const key = `ll_seen_company_status:${companyEmail.toLowerCase()}`;
    const seen = String(localStorage.getItem(key) ?? "");
    if (nextStatus === "VERIFIED" && seen !== "VERIFIED") {
      setApprovalNotice(
        "Your company has been approved. You now have full access to shipments and truck actions.",
      );
      localStorage.setItem(key, "VERIFIED");
    }
  }, [companyEmail, updateUser, user?.status]);

  const movingTruckPosition: LatLngExpression =
    demoRoute[tick % demoRoute.length];

  const {
    truckCount,
    openLoadsCount,
    recentOpenLoads,
    pieMarketplace,
    pieFleet,
  } = useMemo(() => {
    void refresh;
    if (apiToken) {
      const trucks = apiSummary.trucks;
      const openShipments = apiSummary.openShipments;
      const activeShipments = apiSummary.activeShipments;
      const availabilityCounts = trucks.reduce(
        (acc, t) => {
          const s = String(
            t.availability_status ?? t.availabilityStatus ?? "AVAILABLE",
          );
          acc[s] = (acc[s] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );
      return {
        truckCount: trucks.length,
        openLoadsCount: openShipments.length,
        recentOpenLoads: [] as any[],
        pieMarketplace: [
          {
            name: "Open shipments",
            value: openShipments.length || 1,
            fill: "#0B0B0F",
          },
          {
            name: "Active shipments",
            value: activeShipments.length || 1,
            fill: "#F5C518",
          },
        ],
        pieFleet:
          trucks.length > 0
            ? [
                {
                  name: "Available",
                  value: availabilityCounts.AVAILABLE ?? 0,
                  fill: "#F5C518",
                },
                {
                  name: "Reserved",
                  value: availabilityCounts.RESERVED ?? 0,
                  fill: "#0B0B0F",
                },
                {
                  name: "In transit",
                  value: availabilityCounts.IN_TRANSIT ?? 0,
                  fill: "#C9A227",
                },
                {
                  name: "Unavailable",
                  value: availabilityCounts.UNAVAILABLE ?? 0,
                  fill: "#6B7280",
                },
              ].map((d) => ({ ...d, value: d.value || 1 }))
            : [{ name: "No trucks yet", value: 1, fill: "#9CA3AF" }],
      };
    }

    ensureSeedLoads(); // seed demo loads so company sees something on first login
    const loads = getAllLoads();
    const openLoads = loads.filter((l) => l.status === "open");
    const trucks = getTrucksByCompany(companyName);
    const myBidLoads = loads.filter((l) =>
      l.offers?.some((o) => o.companyName === companyName),
    ).length;
    const openNoBid = openLoads.filter(
      (l) => !l.offers?.some((o) => o.companyName === companyName),
    ).length;
    const closed = loads.filter((l) => l.status === "closed").length;
    const fleetOnRoute = Math.min(2, trucks.length);
    const fleetIdle = Math.max(0, trucks.length - 2);
    const fleetMaintenance = trucks.length > 3 ? 1 : 0;
    return {
      truckCount: trucks.length,
      openLoadsCount: openLoads.length,
      recentOpenLoads: openLoads.slice(0, 4),
      pieMarketplace: [
        {
          name: "Shipments you responded to",
          value: myBidLoads || 0,
          fill: "#F5C518",
        },
        { name: "Open shipments", value: openNoBid || 0, fill: "#0B0B0F" },
        { name: "Already taken", value: closed || 0, fill: "#6B7280" },
      ].map((d) => ({ ...d, value: d.value || 1 })),
      pieFleet:
        trucks.length > 0
          ? [
              {
                name: "On the road",
                value: fleetOnRoute || 1,
                fill: "#F5C518",
              },
              {
                name: "Available / waiting",
                value: fleetIdle || 1,
                fill: "#0B0B0F",
              },
              {
                name: "In maintenance",
                value: fleetMaintenance || 1,
                fill: "#C9A227",
              },
            ]
          : [{ name: "No trucks yet", value: 1, fill: "#9CA3AF" }],
    };
  }, [companyName, refresh, apiToken, apiSummary]);

  const trend = useMemo(() => {
    // demo analytics for dashboard visuals
    return [
      { name: "Mon", shipments: 8, activity: 40 },
      { name: "Tue", shipments: 10, activity: 55 },
      { name: "Wed", shipments: 7, activity: 38 },
      { name: "Thu", shipments: 12, activity: 70 },
      { name: "Fri", shipments: 11, activity: 62 },
      { name: "Sat", shipments: 14, activity: 86 },
      { name: "Sun", shipments: 9, activity: 48 },
    ];
  }, []);

  const kpis = useMemo(() => {
    const last = trend[trend.length - 1]?.shipments ?? 0;
    const prev = trend[trend.length - 2]?.shipments ?? 0;
    const delta = prev === 0 ? 0 : Math.round(((last - prev) / prev) * 100);
    const onTime = 92; // demo %
    const utilization = 86; // demo %
    return { shipmentsToday: last, delta, onTime, utilization };
  }, [trend]);

  useEffect(() => {
    const t = apiToken;
    if (!t) return;
    const tokenStr: string = t;
    let cancelled = false;
    async function load() {
      setApiError(null);
      try {
        const [trucks, openShipments, activeShipments] = await Promise.all([
          getMyTrucks(tokenStr),
          getAvailableShipments(tokenStr),
          getActiveShipments(tokenStr),
        ]);
        if (cancelled) return;
        setApiSummary({ trucks, openShipments, activeShipments });
      } catch (e) {
        if (cancelled) return;
        const err = e as ApiError;
        setApiError(err.message || "Could not load company dashboard data.");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [apiToken, refresh]);

  return (
    <div className="space-y-6 ll-animate-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            Company dashboard
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            A clear overview of your trucks, open shipments, and what is
            currently on the road.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/company/shipments"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors shadow-sm"
          >
            Open shipments
          </Link>
          <button
            type="button"
            onClick={() => setRefresh((v) => v + 1)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-stone-900 hover:underline"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            Refresh
          </button>
        </div>
      </div>

      {approvalNotice && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-emerald-900">Approved</p>
            <p className="text-sm text-emerald-800 mt-1">{approvalNotice}</p>
          </div>
          <button
            type="button"
            onClick={() => setApprovalNotice(null)}
            className="text-emerald-800 text-sm font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {apiError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {apiError}
        </p>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-stone-900">
                Route map
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Kigali → Gisenyi (simulated)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowFleetMap(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
            >
              Expand
            </button>
          </div>
          <div className="h-[320px] relative">
            <CompanyFleetMap
              trucks={demoFleet}
              heightClassName="h-full"
              route={demoRoute}
              movingTruckPosition={movingTruckPosition}
            />
            <div className="pointer-events-none absolute top-4 left-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-2xl bg-white/95 backdrop-blur px-3 py-2 text-xs font-semibold text-stone-800 border border-stone-200 shadow-sm">
                <span className="inline-block h-2 w-2 rounded-full bg-accent" />
                Live track (demo)
              </span>
              <span className="inline-flex items-center gap-2 rounded-2xl bg-white/95 backdrop-blur px-3 py-2 text-xs font-semibold text-stone-800 border border-stone-200 shadow-sm">
                {demoFleet.length} trucks
              </span>
              <span className="inline-flex items-center gap-2 rounded-2xl bg-white/95 backdrop-blur px-3 py-2 text-xs font-semibold text-stone-800 border border-stone-200 shadow-sm">
                ETA 1h 50m
              </span>
            </div>
            <div className="absolute top-4 right-4">
              <div className="rounded-3xl bg-white/95 backdrop-blur border border-stone-200 shadow-sm p-3 w-[220px]">
                <p className="text-[11px] font-semibold text-stone-900">
                  Current truck capacity
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-stone-500">Utilization</span>
                  <span className="text-xs font-semibold text-stone-900">
                    86%
                  </span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-stone-200 overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: "86%" }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-stone-500">
                  Route is simulated for the demo UI.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
          <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm transition-shadow hover:shadow-md">
            <p className="text-xs font-semibold text-stone-500">Trucks</p>
            <p className="mt-2 text-3xl font-bold text-stone-900">
              {truckCount}
            </p>
            <p className="mt-2 text-xs text-stone-500">Total in fleet</p>
          </div>
          <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm transition-shadow hover:shadow-md">
            <p className="text-xs font-semibold text-stone-500">
              Open shipments
            </p>
            <p className="mt-2 text-3xl font-bold text-stone-900">
              {openLoadsCount}
            </p>
            <p className="mt-2 text-xs text-stone-500">Available to accept</p>
          </div>
          <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-stone-500">
                  On-time rate
                </p>
                <p className="mt-2 text-3xl font-bold text-stone-900">
                  {kpis.onTime}%
                </p>
                <p className="mt-2 text-xs text-stone-500">
                  Delivery performance (demo)
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 text-accent border border-accent/20 px-2.5 py-1 text-xs font-semibold">
                +3%
              </span>
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-stone-500">
                  Shipments today
                </p>
                <p className="mt-2 text-3xl font-bold text-stone-900">
                  {kpis.shipmentsToday}
                </p>
                <p className="mt-2 text-xs text-stone-500">
                  Compared to yesterday
                </p>
              </div>
              <span
                className={[
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
                  kpis.delta >= 0
                    ? "bg-accent/10 text-accent border-accent/20"
                    : "bg-stone-100 text-stone-700 border-stone-200",
                ].join(" ")}
              >
                {kpis.delta >= 0 ? "+" : ""}
                {kpis.delta}%
              </span>
            </div>
            <div className="mt-3 h-20">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trend}
                  margin={{ left: -18, right: 6, top: 8, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(v: unknown) => [String(v ?? ""), "Shipments"]}
                  />
                  <Bar
                    dataKey="shipments"
                    radius={[8, 8, 8, 8]}
                    fill="#F5C518"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm transition-shadow hover:shadow-md">
          <h2 className="text-sm font-semibold text-stone-900">
            Fleet utilization
          </h2>
          <p className="text-xs text-stone-500 mt-1">Truck deployment status</p>
          <div className="h-[160px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieFleet}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={68}
                  paddingAngle={2}
                >
                  {pieFleet.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: unknown, n: unknown) => [
                    String(v ?? ""),
                    String(n ?? ""),
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 space-y-1.5">
            {pieFleet.map((entry) => (
              <li
                key={entry.name}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: entry.fill }}
                  />
                  <span className="text-xs text-stone-600 truncate">
                    {entry.name}
                  </span>
                </div>
                <span className="text-xs font-bold text-stone-800 tabular-nums shrink-0">
                  {entry.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm transition-shadow hover:shadow-md">
          <h2 className="text-sm font-semibold text-stone-900">
            Marketplace activity
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Bid vs open opportunities
          </p>
          <div className="h-[160px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieMarketplace}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={68}
                  paddingAngle={2}
                >
                  {pieMarketplace.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: unknown, n: unknown) => [
                    String(v ?? ""),
                    String(n ?? ""),
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 space-y-1.5">
            {pieMarketplace.map((entry) => (
              <li
                key={entry.name}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: entry.fill }}
                  />
                  <span className="text-xs text-stone-600 truncate">
                    {entry.name}
                  </span>
                </div>
                <span className="text-xs font-bold text-stone-800 tabular-nums shrink-0">
                  {entry.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm transition-shadow hover:shadow-md">
          <h2 className="text-sm font-semibold text-stone-900">
            Weekly shipments
          </h2>
          <p className="text-xs text-stone-500 mt-1">Last 7 days (demo)</p>
          <div className="h-[220px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trend}
                margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                />
                <YAxis hide />
                <Tooltip
                  formatter={(v: unknown) => [String(v ?? ""), "Shipments"]}
                />
                <Bar dataKey="shipments" radius={[6, 6, 0, 0]} fill="#F5C518" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-stone-900">
                Quick actions
              </h2>
              <p className="text-xs text-stone-500 mt-1">Common tasks</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              to="/company/shipments"
              className="rounded-2xl border border-stone-200 bg-stone-50 p-4 hover:bg-white transition-colors"
            >
              <p className="text-sm font-semibold text-stone-900">
                Browse shipments
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Accept fixed-price loads
              </p>
            </Link>
            <Link
              to="/company/trucks"
              className="rounded-2xl border border-stone-200 bg-stone-50 p-4 hover:bg-white transition-colors"
            >
              <p className="text-sm font-semibold text-stone-900">My trucks</p>
              <p className="text-xs text-stone-500 mt-1">
                Fleet details & ratings
              </p>
            </Link>
            <Link
              to="/company/active-shipments"
              className="rounded-2xl border border-stone-200 bg-stone-50 p-4 hover:bg-white transition-colors"
            >
              <p className="text-sm font-semibold text-stone-900">
                Active shipments
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Track stages & progress
              </p>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-900">Latest loads</h2>
          <p className="text-xs text-stone-500 mt-1">
            Marketplace snapshot (demo)
          </p>
          <div className="mt-4 space-y-3">
            {recentOpenLoads.map((l) => (
              <div
                key={l.id}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">
                      {l.origin} → {l.destination}
                    </p>
                    <p className="text-xs text-stone-500 mt-1">
                      {new Date(l.date).toLocaleDateString()} · {l.weight}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-accent whitespace-nowrap">
                    {l.price ?? "Fixed price"}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-stone-500">
                    by {l.createdBy}
                  </span>
                  <Link
                    to="/company/shipments"
                    className="text-xs font-semibold text-stone-700 hover:text-stone-900 hover:underline"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {showFleetMap && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl mx-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
                <div>
                  <h3 className="text-sm font-semibold text-stone-900">
                    Fleet movement (demo)
                  </h3>
                  <p className="text-xs text-stone-500">
                    Simulated truck positions for your company across Rwanda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFleetMap(false)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-800"
                  aria-label="Close fleet map"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="h-80">
                <CompanyFleetMap trucks={demoFleet} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
