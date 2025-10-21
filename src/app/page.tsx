"use client";
import React, { useMemo, useState } from "react";
import { fetchPG688Counts } from "./services/pg688.service";
import { fetchNEW88Counts } from "./services/new88.service";
import { fetch78WINCounts } from "./services/78win.service";
import { fetchMB66Counts } from "./services/mb66.service";
import { fetchTH39Counts } from "./services/th39.service";
import { fetchVG98Counts } from "./services/vg98.service";
import { fetchJL69Counts } from "./services/jl69.service";
import { fetch711PGCounts } from "./services/711pg.service";

const sampleSites = [
  { id: 1, name: "PG688", logo: "/logos/PG688.webp", counts: { new: 0, review: 0, transfer: 0, bounce: 0 } },
  { id: 2, name: "NEW88", logo: "/logos/NEW88.webp", counts: { new: 0, review: 0, transfer: 0, bounce: 0 } },
  { id: 3, name: "78WIN", logo: "/logos/78WIN.png", counts: { new: 0, review: 0, transfer: 0, bounce: 0 } },
  { id: 4, name: "MB66", logo: "/logos/MB66.png", counts: { new: 0, review: 0, transfer: 0, bounce: 0 } },
  { id: 5, name: "TH39", logo: "/logos/TH39.png", counts: { new: 0, review: 0, transfer: 0, bounce: 0 } },
  { id: 6, name: "VG98", logo: "/logos/VG98.png", counts: { new: 0, review: 0, transfer: 0, bounce: 0 } },
  { id: 7, name: "JL69", logo: "/logos/JL69.png", counts: { new: 0, review: 0, transfer: 0, bounce: 0 } },
  { id: 8, name: "711PG", logo: "/logos/711PG.png", counts: { new: 0, review: 0, transfer: 0, bounce: 0 } },
];

const STATUSES = [
  { key: "new", label: "Withdraw-New", bg: "bg-emerald-50", ring: "ring-emerald-200", text: "text-emerald-700" }, //ถอนใหม่
  { key: "review", label: "Withdraw-In-Review", bg: "bg-blue-50", ring: "ring-blue-200", text: "text-blue-700" }, //ตรวจสอบก่อนไปจ่าย
  { key: "transfer", label: "Withdraw-Approve", bg: "bg-amber-50", ring: "ring-amber-200", text: "text-amber-700" }, //กำลังโอน
  { key: "bounce", label: "Third-Party-Refusal", bg: "bg-rose-50", ring: "ring-rose-200", text: "text-rose-700" }, //ตีกลับ
];

const Logo = () => (
  <img src="/logos/logo.png" alt="logo" className="h-10 w-10 rounded-lg object-contain p-1" />
);

const tabRefs: Record<number, Window | null> = {};

export default function PendingDashboard() {
  const [sites, setSites] = useState(sampleSites);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredSites = useMemo(() => {
    return sites.filter((s) => {
      const byName = s.name.toLowerCase().includes(search.toLowerCase());
      const byStatus =
        filter === "all" ? true : (s.counts[filter as keyof typeof s.counts] ?? 0) > 0;
      return byName && byStatus;
    });
  }, [sites, search, filter]);

  const totals = useMemo(() => {
    return filteredSites.reduce(
      (acc, s) => {
        acc.new += s.counts.new;
        acc.review += s.counts.review;
        acc.transfer += s.counts.transfer;
        acc.bounce += s.counts.bounce;
        return acc;
      },
      { new: 0, review: 0, transfer: 0, bounce: 0 }
    );
  }, [filteredSites]);

  const handleRefresh = async (siteId: number) => {
    console.log(`Refreshing site ${siteId}...`);
    try {
      if (siteId === 1) {
        const counts = await fetchPG688Counts();
        console.log("PG688 API counts:", counts);
        setSites((prev) =>
          prev.map((s) => (s.id === siteId ? { ...s, counts } : s))
        );
      } else if (siteId === 2) {
        const counts = await fetchNEW88Counts();
        console.log("NEW88 API counts:", counts);
        setSites((prev) =>
          prev.map((s) => (s.id === siteId ? { ...s, counts } : s))
        );
      } else if (siteId === 3) {
        const counts = await fetch78WINCounts();
        console.log("78WIN API counts:", counts);
        setSites((prev) =>
          prev.map((s) => (s.id === siteId ? { ...s, counts } : s))
        );
      } else if (siteId === 4) {
        const counts = await fetchMB66Counts();
        console.log("MB66 API counts:", counts);
        setSites((prev) =>
          prev.map((s) => (s.id === siteId ? { ...s, counts } : s))
        );
      } else if (siteId === 5) {
        const counts = await fetchTH39Counts();
        console.log("TH39 API counts:", counts);
        setSites((prev) =>
          prev.map((s) => (s.id === siteId ? { ...s, counts } : s))
        );
      } else if (siteId === 6) {
        const counts = await fetchVG98Counts();
        console.log("VG98 API counts:", counts);
        setSites((prev) =>
          prev.map((s) => (s.id === siteId ? { ...s, counts } : s))
        );
      } else if (siteId === 7) {
        const counts = await fetchJL69Counts();
        console.log("VG98 API counts:", counts);
        setSites((prev) =>
          prev.map((s) => (s.id === siteId ? { ...s, counts } : s))
        );
      } else if (siteId === 8) {
        const counts = await fetch711PGCounts();
        console.log("711PG API counts:", counts);
        setSites((prev) =>
          prev.map((s) => (s.id === siteId ? { ...s, counts } : s))
        );
      }
    } catch (err) {
      console.error(`Error refreshing site ${siteId}:`, err);
    }
  };

  const handleRoute = (siteId: number) => {
    const site = sites.find((s) => s.id === siteId);
    if (!site) return;

    // Each site config is in sites.json
    const siteInfo = require("./data/sites.json").find((x: any) => x.id === siteId);
    if (!siteInfo?.referer) {
      console.error("No referer found for site:", siteId);
      return;
    }

    const url = `${siteInfo.referer.replace(/\/$/, "")}/20008`;

    // ✅ Reuse tab if exists and still open
    if (tabRefs[siteId] && !tabRefs[siteId]?.closed) {
      tabRefs[siteId]?.focus();
      tabRefs[siteId]!.location.href = url;
    } else {
      tabRefs[siteId] = window.open(url, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-6 text-gray-800">
      <div className="mx-auto max-w-[1800px]">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
          {/* Left Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Logo />
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  แดชบอร์ดสรุปรายการค้าง (Pending Withdrawal Dashboard)
                </h1>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                onClick={() => setFilter("all")}
                className={`rounded-xl px-3 py-1 text-sm ring-1 transition ${
                  filter === "all"
                    ? "bg-gray-900 text-white ring-gray-900"
                    : "bg-white text-gray-700 ring-gray-300 hover:bg-gray-100"
                }`}
              >
                ทั้งหมด (All)
              </button>
              {STATUSES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setFilter(s.key)}
                  className={`rounded-xl px-3 py-1 text-sm ring-1 transition ${
                    filter === s.key
                      ? `${s.bg} ${s.text} ring-2 ${s.ring}`
                      : "bg-white text-gray-700 ring-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex flex-col items-end gap-3 w-full md:w-auto">
            <div className="flex flex-wrap justify-end gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-gray-200">
                <span className="text-[11px] text-gray-500">รวม (Total)</span>
                <span className="text-sm font-semibold text-gray-700">
                  {filteredSites.length}
                </span>
                <span className="text-[11px] text-gray-400">เว็บ (Sites)</span>
              </div>

              {STATUSES.map((s) => (
                <div
                  key={s.key}
                  className={`flex items-center gap-2 rounded-xl ${s.bg} px-3 py-2 ring-1 ${s.ring}`}
                >
                  <span className={`text-[11px] ${s.text}`}>{s.label}</span>
                  <span className={`text-sm font-semibold ${s.text}`}>
                    {totals[s.key as keyof typeof totals]}
                  </span>
                </div>
              ))}
            </div>

            {/* Search */}
            <input
              placeholder="ค้นหาเว็บไซต์... (Search Site...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-72 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>

        {/* Sites grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-6">
          {filteredSites.map((site) => (
            <div
              key={site.id}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition hover:shadow-md h-64"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={site.logo || "/logos/logo1.png"}
                    alt={site.name}
                    className="h-8 w-8 rounded-md object-contain"
                  />
                  <h3 className="text-sm font-semibold text-gray-900">{site.name}</h3>
                </div>
                <span className="rounded-lg bg-gray-100 px-2 py-1 text-[12px] font-medium text-gray-700 ring-1 ring-gray-200">
                  รวม (Total) {Object.values(site.counts).reduce((a, b) => a + b, 0)} รายการ (Records)
                </span>
              </div>

              {/* 4 boxes in order */}
              <div className="mt-12 grid grid-cols-4 gap-2 mb-4">
                {STATUSES.map((s) => (
                  <div
                    key={s.key}
                    className={`rounded-xl ${s.bg} ${s.ring} ring-1 p-3 text-center`}
                  >
                    <p className={`text-[11px] ${s.text}`}>{s.label}</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {site.counts[s.key as keyof typeof site.counts]}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-between text-[12px] text-gray-500">
                {/* อัปเดตล่าสุด */}
                <span>Last Updated: {new Date().toLocaleTimeString()}</span> 
                <div className="flex gap-2">
                  {/* Route button */}
                  <button
                    onClick={() => handleRoute(site.id)}
                    className="rounded-lg px-2 py-1 ring-1 ring-gray-300 hover:bg-gray-100"
                  >
                    Route
                  </button>

                  {/* Refresh button */}{/* รายละเอียด */}
                  <button
                    onClick={() => handleRefresh(site.id)}
                    className="rounded-lg px-2 py-1 ring-1 ring-gray-300 hover:bg-gray-100"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
