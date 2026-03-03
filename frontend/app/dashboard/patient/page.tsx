"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "../../../services/authService";
import { getProfile, createProfile } from "../../../services/patientService";
import { getLabResults } from "../../../services/patientService";
import { formatDate } from "../../../lib/utils";

export default function PatientDashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [labResults, setLabResults] = useState<any[]>([]);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileForm, setProfileForm] = useState({
    date_of_birth: "",
    sex: "M",
    height_cm: "",
    weight_kg: "",
    medical_history: "",
    medications: "",
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const userResponse = await getCurrentUser();
        setUser(userResponse.data);
        if (userResponse.data.role_id === 12) {
          router.replace("/dashboard/doctor");
        } else {
          router.push("/dashboard/patient");
        }
        try {
          const profileResponse = await getProfile();
          setProfile(profileResponse.data);

          const labResponse = await getLabResults();
          setLabResults(labResponse.data);
        } catch (err) {
          console.log("No profile or lab data yet");
          setShowProfileForm(true);
        }
      } catch (err) {
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

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
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto px-6 py-6 space-y-10">
        <div className="rounded-3xl p-10 bg-black border border-white/10 backdrop-blur-xl shadow-2xl">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome back, {user?.full_name} 👋
          </h1>
          <p className="mt-3 text-gray-400 text-lg">
            Monitor your kidney health and clinical insights in real-time.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-6 text-gray-300">
            📊 Analytics Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="relative bg-black rounded-2xl shadow-md hover:shadow-xl p-6 border border-gray-700 overflow-hidden group hover:scale-[1.02] transition">
              <div className="absolute top-0 right-0 w-2 h-full bg-blue-500 rounded-l-2xl"></div>
              <p className="text-sm text-gray-400">Total Lab Tests</p>
              <p className="text-4xl font-bold mt-2">{labResults.length}</p>
              <span className="text-xs text-gray-400">records</span>
              <div className="absolute bottom-4 right-4 text-2xl opacity-20 group-hover:opacity-40 transition">
                🧪
              </div>
            </div>

            <div className="relative bg-black rounded-2xl shadow-md hover:shadow-xl p-6 border border-gray-700 overflow-hidden group hover:scale-[1.02] transition">
              <div className="absolute top-0 right-0 w-2 h-full bg-red-500 rounded-l-2xl"></div>
              <p className="text-sm text-gray-400">Latest Creatinine</p>
              <p className="text-4xl font-bold mt-2">
                {labResults[0]?.serum_creatinine ?? "N/A"}
              </p>
              <span className="text-xs text-gray-500">mg/dL</span>
              <div className="absolute bottom-4 right-4 text-2xl opacity-20 group-hover:opacity-40 transition">
                🩺
              </div>
            </div>

            {/* BMI */}
            <div className="relative bg-black rounded-2xl shadow-md hover:shadow-xl p-6 border border-gray-700 overflow-hidden group hover:scale-[1.02] transition">
              <p className="text-sm text-gray-400">BMI</p>
              <p className="text-4xl font-bold mt-2">
                {profile?.height_cm && profile?.weight_kg
                  ? (
                      profile.weight_kg / Math.pow(profile.height_cm / 100, 2)
                    ).toFixed(1)
                  : "N/A"}
              </p>
              <div className="absolute bottom-4 right-4 text-2xl opacity-20 group-hover:opacity-40 transition">
                ⚖️
              </div>
            </div>

            {/* Profile Status */}
            <div className="relative bg-black rounded-2xl shadow-md hover:shadow-xl p-6 border border-gray-700 overflow-hidden group hover:scale-[1.02] transition">
              <div className="absolute top-0 right-0 w-2 h-full bg-yellow-500 rounded-l-2xl"></div>
              <p className="text-sm text-gray-400">Profile Status</p>
              <div className="mt-4">
                {profile ? (
                  <span className="px-4 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">
                    Completed
                  </span>
                ) : (
                  <span className="px-4 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-medium">
                    Incomplete
                  </span>
                )}
              </div>
              {!profile && (
                <button
                  onClick={() => setShowProfileForm((s) => !s)}
                  className="mt-4 w-full rounded-xl bg-indigo-600 py-2 text-white font-medium hover:bg-indigo-700 transition"
                >
                  {showProfileForm ? "Close Form" : "Complete Profile"}
                </button>
              )}
              <div className="absolute bottom-4 right-4 text-2xl opacity-20 group-hover:opacity-40 transition">
                👤
              </div>
            </div>
            {showProfileForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm">
                {/* Modal Card */}
                <div className="relative w-full max-w-xl rounded-3xl border border-gray-700 bg-black p-8 shadow-2xl animate-fadeIn">
                  {/* Close Button */}
                  <button
                    onClick={() => setShowProfileForm(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
                  >
                    ✕
                  </button>

                  <h2 className="text-2xl font-bold mb-6 text-white">
                    Complete Your Profile
                  </h2>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        const payload = {
                          date_of_birth: profileForm.date_of_birth,
                          sex: profileForm.sex,
                          height_cm: profileForm.height_cm
                            ? Number(profileForm.height_cm)
                            : undefined,
                          weight_kg: profileForm.weight_kg
                            ? Number(profileForm.weight_kg)
                            : undefined,
                          medical_history: profileForm.medical_history,
                          medications: profileForm.medications,
                        };

                        const res = await createProfile(payload);
                        setProfile(res.data);
                        setShowProfileForm(false);
                      } catch {
                        alert("Failed to create profile");
                      }
                    }}
                    className="grid grid-cols-1 gap-4"
                  >
                    <input
                      type="date"
                      value={profileForm.date_of_birth}
                      onChange={(e) =>
                        setProfileForm((p) => ({
                          ...p,
                          date_of_birth: e.target.value,
                        }))
                      }
                      className="rounded-xl bg-gray-800 border border-gray-700 px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500"
                      required
                    />

                    <select
                      value={profileForm.sex}
                      onChange={(e) =>
                        setProfileForm((p) => ({ ...p, sex: e.target.value }))
                      }
                      className="rounded-xl bg-gray-800 border border-gray-700 px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>

                    <input
                      type="number"
                      placeholder="Height (cm)"
                      value={profileForm.height_cm}
                      onChange={(e) =>
                        setProfileForm((p) => ({
                          ...p,
                          height_cm: e.target.value,
                        }))
                      }
                      className="rounded-xl bg-gray-800 border border-gray-700 px-4 py-2 text-white"
                    />

                    <input
                      type="number"
                      placeholder="Weight (kg)"
                      value={profileForm.weight_kg}
                      onChange={(e) =>
                        setProfileForm((p) => ({
                          ...p,
                          weight_kg: e.target.value,
                        }))
                      }
                      className="rounded-xl bg-gray-800 border border-gray-700 px-4 py-2 text-white"
                    />

                    <input
                      type="text"
                      placeholder="Medical History"
                      value={profileForm.medical_history}
                      onChange={(e) =>
                        setProfileForm((p) => ({
                          ...p,
                          medical_history: e.target.value,
                        }))
                      }
                      className="rounded-xl bg-gray-800 border border-gray-700 px-4 py-2 text-white"
                    />

                    <input
                      type="text"
                      placeholder="Medications"
                      value={profileForm.medications}
                      onChange={(e) =>
                        setProfileForm((p) => ({
                          ...p,
                          medications: e.target.value,
                        }))
                      }
                      className="rounded-xl bg-gray-800 border border-gray-700 px-4 py-2 text-white"
                    />

                    <button className="mt-4 rounded-xl bg-indigo-600 py-2 text-white font-semibold hover:bg-indigo-700 transition">
                      Save Profile
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= ROW 2 — QUICK ACTIONS ================= */}
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-gray-300">
            ⚡ Quick Actions
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                href: "/consultation",
                title: "Voice Consultation",
                desc: "Talk to AI-assisted doctor instantly",
                icon: "🎤",
              },
              {
                href: "/prediction",
                title: "CKD Prediction",
                desc: "Run risk analysis on lab data",
                icon: "🔬",
              },
              {
                href: "/reports",
                title: "Medical Reports",
                desc: "View history & generated reports",
                icon: "📄",
              },
            ].map((item, i) => (
              <a
                key={i}
                href={item.href}
                className="group rounded-3xl bg-black border border-white/10 p-8 shadow-xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-300"
              >
                <div className="text-4xl mb-6">{item.icon}</div>
                <h3 className="text-xl font-semibold group-hover:text-blue-400 transition">
                  {item.title}
                </h3>
                <p className="text-gray-400 mt-2 text-sm">{item.desc}</p>
              </a>
            ))}
          </div>
        </div>
        <div className="bg-black rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
          <div className="px-8 py-6 border-b border-white/10">
            <h2 className="text-2xl font-semibold text-white">
              🧪 Recent Predicted - CKD Lab Results
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Overview of your latest clinical test records
            </p>
          </div>

          {labResults.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              No lab results recorded yet.
            </div>
          ) : (
            <div className="h-[450px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-gray-950 text-gray-400 text-sm uppercase tracking-wide z-10">
                  <tr>
                    <th className="px-8 py-4">Date</th>
                    <th className="px-8 py-4">Creatinine</th>
                    <th className="px-8 py-4">Blood Pressure</th>
                    <th className="px-8 py-4">Albumin</th>
                    <th className="px-8 py-4">Notes</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {labResults.map((result, index) => {
                    const creatinineLevel = result.serum_creatinine;

                    const riskColor =
                      creatinineLevel < 1.2
                        ? "text-green-400 bg-green-500/10"
                        : creatinineLevel < 2
                          ? "text-yellow-400 bg-yellow-500/10"
                          : "text-red-400 bg-red-500/10";

                    return (
                      <tr
                        key={index}
                        className="hover:bg-white/5 transition duration-200"
                      >
                        <td className="px-8 py-5 text-white font-medium">
                          {formatDate(result.test_date)}
                        </td>

                        <td className="px-8 py-5">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${riskColor}`}
                          >
                            {result.serum_creatinine} mg/dL
                          </span>
                        </td>

                        <td className="px-8 py-5 text-gray-300">
                          {result.blood_pressure_sys}/
                          {result.blood_pressure_dia} mmHg
                        </td>

                        <td className="px-8 py-5 text-gray-300">
                          {result.albumin ?? "—"}
                        </td>

                        <td className="px-8 py-5 text-gray-400 max-w-xs truncate">
                          {result.notes || "No notes"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-gray-300">
            🩺 Consultation History
          </h2>

          {/* <div className="rounded-3xl bg-gradient-to-br from-gray-900 to-black border border-white/10 shadow-2xl p-8 space-y-6">
            {consultations?.length === 0 ? (
              <p className="text-gray-500 text-center py-12">
                No consultations yet.
              </p>
            ) : (
              consultations?.slice(0, 5).map((c, index) => (
                <div
                  key={index}
                  className="border-l-2 border-blue-500 pl-6 relative"
                >
                  <div className="absolute -left-[7px] top-2 w-3 h-3 bg-blue-500 rounded-full"></div>
                  <p className="text-sm text-gray-400">
                    {formatDate(c.created_at)}
                  </p>
                  <p className="mt-1 text-white font-medium">
                    {c.summary || "Consultation session"}
                  </p>
                </div>
              ))
            )}
          </div> */}
        </div>
      </div>
    </div>
  );
}
