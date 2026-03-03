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
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-950">
      <div className="mx-auto px-6 py-6 space-y-10">
        <div className="bg-gradient-to-r from-black to-gray-950 text-white rounded-3xl p-8 shadow-xl border-gray-700 border">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome back, {user?.full_name} 👋
          </h1>
          <p className="mt-3 text-indigo-100">
            Monitor your kidney health and track clinical insights in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Lab Tests */}
          <div className="relative bg-gray-950 rounded-2xl shadow-md hover:shadow-xl transition p-6 border border-gray-700 overflow-hidden group">
            <div className="absolute top-0 right-0 w-2 h-full bg-blue-500 rounded-l-2xl"></div>
            <p className="text-sm text-gray-400 uppercase tracking-wide">
              Total Lab Tests
            </p>
            <p className="mt-2 text-3xl font-bold text-white">
              {labResults.length}
            </p>
            <span className="text-xs text-gray-400">records</span>
            <div className="absolute bottom-4 right-4 text-2xl opacity-20 group-hover:opacity-40 transition">
              🧪
            </div>
          </div>

          {/* Latest Creatinine */}
          <div className="relative bg-gray-950 rounded-2xl shadow-md hover:shadow-xl transition p-6 border border-gray-700 overflow-hidden group">
            <div className="absolute top-0 right-0 w-2 h-full bg-red-500 rounded-l-2xl"></div>
            <p className="text-sm text-gray-400 uppercase tracking-wide">
              Latest Creatinine
            </p>
            <p className="mt-2 text-3xl font-bold text-white">
              {labResults[0]?.serum_creatinine ?? "N/A"}
            </p>
            <span className="text-xs text-gray-400">mg/dL</span>
            <div className="absolute bottom-4 right-4 text-2xl opacity-20 group-hover:opacity-40 transition">
              🩺
            </div>
          </div>

          {/* BMI */}
          <div className="relative bg-gray-950 rounded-2xl shadow-md hover:shadow-xl transition p-6 border border-gray-700 overflow-hidden group">
            <div className="absolute top-0 right-0 w-2 h-full bg-green-500 rounded-l-2xl"></div>
            <p className="text-sm text-gray-400 uppercase tracking-wide">BMI</p>
            <p className="mt-2 text-3xl font-bold text-white">
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
          <div className="relative bg-gray-950 rounded-2xl shadow-md hover:shadow-xl transition p-6 border border-gray-700 overflow-hidden group">
            <div className="absolute top-0 right-0 w-2 h-full bg-yellow-500 rounded-l-2xl"></div>
            <p className="text-sm text-gray-400 uppercase tracking-wide">
              Profile Status
            </p>
            <div className="mt-3">
              {profile ? (
                <span className="px-3 py-1 text-sm rounded-full bg-green-700 text-white font-medium">
                  Completed
                </span>
              ) : (
                <span className="px-3 py-1 text-sm rounded-full bg-red-700 text-white font-medium">
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
                    setProfileForm((p) => ({ ...p, height_cm: e.target.value }))
                  }
                  className="rounded-xl bg-gray-800 border border-gray-700 px-4 py-2 text-white"
                />

                <input
                  type="number"
                  placeholder="Weight (kg)"
                  value={profileForm.weight_kg}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, weight_kg: e.target.value }))
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

        {/* QUICK ACTIONS + LAB RESULTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-black rounded-3xl shadow-2xl p-8 border border-gray-700">
            <h2 className="text-3xl font-extrabold mb-6 text-white">
              ⚡ Quick Actions
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  href: "/consultation",
                  title: "Voice Consultation",
                  description: "Talk to AI-assisted doctor instantly",
                  color: "blue",
                  icon: "🎤",
                },
                {
                  href: "/prediction",
                  title: "CKD Prediction",
                  description: "Run risk analysis on lab data",
                  color: "blue",
                  icon: "🔬",
                },
                {
                  href: "/reports",
                  title: "Medical Reports",
                  description: "View patient history & reports",
                  color: "blue",
                  icon: "📄",
                },
              ].map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  className={`group relative flex flex-col justify-between p-6 rounded-2xl bg-gray-950 hover:bg-gray-800 transition-transform transform hover:scale-105 shadow-lg border border-gray-800 overflow-hidden`}
                >
                  <span
                    className={`absolute left-0 top-0 h-full w-2 rounded-l-2xl bg-${item.color}-500`}
                  />

                  {/* Icon */}
                  <div className="text-4xl mb-4">{item.icon}</div>

                  <h3 className="text-xl font-semibold text-white group-hover:text-${item.color}-400">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 mt-1 text-sm">
                    {item.description}
                  </p>

                  <div className="absolute inset-0 bg-${item.color}-500/10 opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity"></div>
                </a>
              ))}
            </div>
          </div>

          <div className="bg-black rounded-3xl shadow-2xl p-8 border border-gray-700">
            <h2 className="text-3xl font-extrabold mb-6 text-white">
              🧪 Recent Lab Results
            </h2>

            {labResults.length === 0 ? (
              <p className="text-gray-400 text-center py-10 italic">
                No lab results recorded yet.
              </p>
            ) : (
              <div className="space-y-4">
                {labResults.slice(0, 5).map((result, index) => {
                  const creatinineLevel = result.serum_creatinine;
                  const riskColor =
                    creatinineLevel < 1.2
                      ? "bg-green-500/20 text-green-400"
                      : creatinineLevel < 2
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400";

                  return (
                    <div
                      key={index}
                      className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 rounded-2xl bg-gray-950 hover:bg-gray-700 transition-all border border-gray-700 shadow-md"
                    >
                      <div className="flex-1">
                        <p className="text-lg font-semibold text-white">
                          Date: {formatDate(result.test_date)}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          Creatinine:{" "}
                          <span
                            className={`font-bold px-2 py-1 rounded-full ${riskColor}`}
                          >
                            {result.serum_creatinine} mg/dL
                          </span>
                        </p>
                      </div>

                      <div className="flex-1 mt-3 md:mt-0 md:text-center">
                        <p className="text-sm text-gray-400">
                          BP:{" "}
                          <span className="font-medium text-white">
                            {result.blood_pressure_sys}/
                            {result.blood_pressure_dia} mmHg
                          </span>
                        </p>
                        {result.albumin && (
                          <p className="text-sm text-gray-400 mt-1">
                            Albumin:{" "}
                            <span className="font-medium text-white">
                              {result.albumin} g/dL
                            </span>
                          </p>
                        )}
                      </div>

                      {/* Right: Notes / Mini Badge */}
                      <div className="flex-1 mt-3 md:mt-0 md:text-right">
                        {result.notes ? (
                          <p className="text-sm text-gray-300 italic truncate max-w-xs">
                            "{result.notes}"
                          </p>
                        ) : (
                          <span className="text-sm text-gray-500">
                            No notes
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* View All Button */}
            {labResults.length > 5 && (
              <div className="mt-6 text-center">
                <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg transition">
                  View All Lab Results
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
