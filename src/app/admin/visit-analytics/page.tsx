"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Globe, Clock, Users, TrendingUp, RefreshCw, Monitor } from "lucide-react";

const VisitMap = dynamic(() => import("./VisitMap"), { ssr: false });

interface Summary {
  total_visits: number; unique_ips: number; unique_sessions: number;
  avg_time_s: number; today_visits: number;
}
interface PageRow   { page_path: string; visits: number; avg_time_s: number }
interface CountryRow { country: string; visits: number; unique_ips: number }
interface IpRow {
  ip_address: string; country: string; region: string; city: string;
  lat: number|null; lng: number|null; visits: number; total_time_s: number; last_seen: string;
}
interface MapPoint  { lat: number; lng: number; country: string; city: string; visits: number }
interface DayRow    { date: string; visits: number }

function fmtTime(s: number): string {
  if (!s) return "—";
  if (s < 60)  return `${s}s`;
  if (s < 3600) return `${Math.floor(s/60)}m ${s%60}s`;
  return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`;
}

const CARD = { background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" };

export default function VisitAnalyticsPage() {
  const [days, setDays]     = useState(30);
  const [loading, setLoad]  = useState(true);
  const [tab, setTab]       = useState<"pages"|"countries"|"ips"|"map">("pages");
  const [summary, setSummary]         = useState<Summary|null>(null);
  const [topPages, setTopPages]       = useState<PageRow[]>([]);
  const [topCountries, setCountries]  = useState<CountryRow[]>([]);
  const [ipList, setIpList]           = useState<IpRow[]>([]);
  const [mapPoints, setMapPoints]     = useState<MapPoint[]>([]);
  const [dailyTrend, setDailyTrend]   = useState<DayRow[]>([]);

  const load = useCallback(async () => {
    setLoad(true);
    try {
      const res = await fetch(`/api/admin/visit-analytics?days=${days}`);
      const data = await res.json();
      setSummary(data.summary);
      setTopPages(data.topPages ?? []);
      setCountries(data.topCountries ?? []);
      setIpList(data.ipList ?? []);
      setMapPoints(data.mapPoints ?? []);
      setDailyTrend(data.dailyTrend ?? []);
    } catch { /* ignore */ }
    setLoad(false);
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const statCards = [
    { label: "Total Visits",    value: summary?.total_visits ?? 0,   icon: TrendingUp, color: "#2070B8" },
    { label: "Today",           value: summary?.today_visits ?? 0,   icon: Monitor,    color: "#059669" },
    { label: "Unique Visitors", value: summary?.unique_ips ?? 0,     icon: Users,      color: "#7c3aed" },
    { label: "Avg. Time",       value: fmtTime(summary?.avg_time_s ?? 0), icon: Clock, color: "#C0185A", raw: true },
  ];

  const maxVisits = Math.max(...dailyTrend.map(d => d.visits), 1);

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Visitor Analytics</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>Page visits, IP tracking, time on site &amp; location map</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={days} onChange={e => setDays(Number(e.target.value))}
            style={{ padding: "6px 10px", borderRadius: 7, border: "1px solid #e2e8f0", fontSize: 13, color: "#374151", background: "#fff" }}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
          <button onClick={load} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:7, border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", fontSize:13, color:"#374151" }}>
            <RefreshCw size={13} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
        {statCards.map(c => (
          <div key={c.label} style={CARD}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: `${c.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <c.icon size={18} style={{ color: c.color }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{c.label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
              {loading ? "—" : (c.raw ? c.value : Number(c.value).toLocaleString())}
            </div>
          </div>
        ))}
      </div>

      {/* Daily trend bar chart */}
      {dailyTrend.length > 0 && (
        <div style={{ ...CARD, marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>Daily Visits</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 80, overflowX: "auto" }}>
            {dailyTrend.map(d => (
              <div key={d.date} title={`${d.date}: ${d.visits} visits`}
                style={{ flex: "0 0 auto", width: 18, background: "#2070B8", borderRadius: "3px 3px 0 0",
                  height: `${Math.round((d.visits / maxVisits) * 80)}px`, minHeight: 2, cursor: "default" }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
            <span>{dailyTrend[0]?.date}</span>
            <span>{dailyTrend[dailyTrend.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ ...CARD, padding: 0 }}>
        <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9", padding: "0 4px" }}>
          {(["pages","countries","ips","map"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "12px 18px", fontSize: 13, fontWeight: tab===t?700:500, color: tab===t?"#2070B8":"#64748b",
                background: "none", border: "none", borderBottom: `2px solid ${tab===t?"#2070B8":"transparent"}`, cursor: "pointer", textTransform: "capitalize" }}>
              {t === "ips" ? "IP Details" : t === "map" ? (
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Globe size={13} />Map</span>
              ) : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ padding: 20 }}>
          {/* Pages tab */}
          {tab === "pages" && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Page Path", "Visits", "Avg. Time"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topPages.map((r, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: "10px 14px", color: "#2070B8", fontWeight: 500, maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.page_path}</td>
                      <td style={{ padding: "10px 14px", color: "#0f172a", fontWeight: 700 }}>{r.visits.toLocaleString()}</td>
                      <td style={{ padding: "10px 14px", color: "#64748b" }}>{fmtTime(r.avg_time_s)}</td>
                    </tr>
                  ))}
                  {topPages.length === 0 && <tr><td colSpan={3} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>No data yet</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* Countries tab */}
          {tab === "countries" && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Country", "Visits", "Unique IPs"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "1px solid #f1f5f9" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topCountries.map((r, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: "10px 14px", color: "#0f172a", fontWeight: 600 }}>{r.country}</td>
                      <td style={{ padding: "10px 14px", color: "#0f172a" }}>{r.visits.toLocaleString()}</td>
                      <td style={{ padding: "10px 14px", color: "#64748b" }}>{r.unique_ips.toLocaleString()}</td>
                    </tr>
                  ))}
                  {topCountries.length === 0 && <tr><td colSpan={3} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>No data yet</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* IPs tab */}
          {tab === "ips" && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["IP Address", "Location", "Visits", "Total Time", "Last Seen"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ipList.map((r, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#0f172a", fontSize: 12 }}>{r.ip_address}</td>
                      <td style={{ padding: "10px 14px", color: "#64748b" }}>
                        {[r.city, r.region, r.country].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#0f172a", fontWeight: 700 }}>{r.visits}</td>
                      <td style={{ padding: "10px 14px", color: "#64748b" }}>{fmtTime(r.total_time_s)}</td>
                      <td style={{ padding: "10px 14px", color: "#94a3b8", fontSize: 11 }}>
                        {new Date(r.last_seen).toLocaleDateString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}
                      </td>
                    </tr>
                  ))}
                  {ipList.length === 0 && <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>No data yet</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* Map tab */}
          {tab === "map" && <VisitMap points={mapPoints} />}
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 0.8s linear infinite}`}</style>
    </div>
  );
}
