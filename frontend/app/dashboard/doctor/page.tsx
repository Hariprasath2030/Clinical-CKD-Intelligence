"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "../../../services/authService";
import api from "../../../lib/api";
import { formatDate } from "../../../lib/utils";

export default function DoctorDashboard() {
  const [user, setUser] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const userResponse = await getCurrentUser();
        setUser(userResponse.data);

        const patientsResponse = await api.get("/api/doctor/patients");
        setPatients(patientsResponse.data);
      } catch {
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) =>
      p.full_name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [patients, search]);

  const stats = {
    total: patients.length,
    highRisk: patients.filter(
      (p) => p.risk_level === "high" || p.risk_level === "critical",
    ).length,
    stage45: patients.filter(
      (p) => p.latest_ckd_stage === "4" || p.latest_ckd_stage === "5",
    ).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-6 py-10">
      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-100">
          👨‍⚕️ Doctor Dashboard
        </h1>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard title="Total Patients" value={stats.total} color="blue" />
        <StatCard title="High Risk" value={stats.highRisk} color="red" />
        <StatCard title="Stage 4-5" value={stats.stage45} color="orange" />
      </div>

      {/* SEARCH */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search patients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-96 px-4 py-2 rounded-xl border border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950"
        />
      </div>

      {/* TABLE */}
      <div className="bg-gray-950 rounded-2xl shadow-lg overflow-hidden border-gray-800 border">
        {filteredPatients.length === 0 ? (
          <div className="p-16 text-center text-gray-200 text-lg">
            🩺 No patients found
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 text-left">Patient</th>
                <th className="px-6 py-4 text-left">CKD Stage</th>
                <th className="px-6 py-4 text-left">eGFR</th>
                <th className="px-6 py-4 text-left">Risk</th>
                <th className="px-6 py-4 text-left">Last Test</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr
                  key={patient.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {patient.full_name}
                  </td>

                  <td className="px-6 py-4">
                    <StageBadge stage={patient.latest_ckd_stage} />
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {patient.latest_egfr?.toFixed(1) || "N/A"}
                  </td>

                  <td className="px-6 py-4">
                    <RiskBadge level={patient.risk_level} />
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {patient.latest_test_date
                      ? formatDate(patient.latest_test_date)
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ---------------- Components ---------------- */

function StatCard({ title, value, color }: any) {
  const colorMap: any = {
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
    orange: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="bg-gray-950 rounded-2xl shadow-md p-6 hover:shadow-xl transition border-gray-800 border">
      <h3 className="text-gray-100 text-md">{title}</h3>
      <div
        className={`mt-4 text-3xl font-bold px-4 py-2 inline-block rounded-xl ${colorMap[color]}`}
      >
        {value}
      </div>
    </div>
  );
}

function StageBadge({ stage }: any) {
  const map: any = {
    "1": "bg-green-100 text-green-700",
    "2": "bg-green-100 text-green-700",
    "3": "bg-yellow-100 text-yellow-700",
    "4": "bg-orange-100 text-orange-700",
    "5": "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${map[stage] || "bg-gray-200 text-gray-600"}`}
    >
      Stage {stage || "N/A"}
    </span>
  );
}

function RiskBadge({ level }: any) {
  const map: any = {
    low: "bg-green-100 text-green-700",
    moderate: "bg-yellow-100 text-yellow-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${map[level] || "bg-gray-100 text-gray-600"}`}
    >
      {level || "N/A"}
    </span>
  );
}
