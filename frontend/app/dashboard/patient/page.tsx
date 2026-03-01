"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "../../../services/authService";
import { getProfile, createProfile } from "../../../services/patientService";
import { getLabResults } from "../../../services/patientService";
import ClinicalDataInput from "../../../components/ui/ClinicalDataInput";
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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-gray-950">
      <div className="mx-auto px-6 py-10 space-y-10">
        <div className="bg-gradient-to-r from-gray-950 to-gray-900 text-white rounded-3xl p-8 shadow-xl border-gray-700 border">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome back, {user?.full_name} 👋
          </h1>
          <p className="mt-3 text-indigo-100">
            Monitor your kidney health and track clinical insights in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition p-6 border-gray-700 border">
            <p className="text-sm text-gray-100">Total Lab Tests</p>
            <p className="mt-2 text-3xl font-bold text-gray-100">
              {labResults.length}
            </p>
          </div>

          <div className="bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition p-6 border-gray-700 border">
            <p className="text-sm text-gray-200">Latest Creatinine</p>
            <p className="mt-2 text-3xl font-bold text-gray-100">
              {labResults[0]?.serum_creatinine ?? "N/A"}
            </p>
            <span className="text-xs text-gray-200">mg/dL</span>
          </div>

          <div className="bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition p-6 border-gray-700 border">
            <p className="text-sm text-gray-200">BMI</p>
            <p className="mt-2 text-3xl font-bold text-gray-100">
              {profile?.height_cm && profile?.weight_kg
                ? (
                    profile.weight_kg / Math.pow(profile.height_cm / 100, 2)
                  ).toFixed(1)
                : "N/A"}
            </p>
          </div>

          <div className="bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition p-6 border-gray-700 border">
            <p className="text-sm text-gray-500">Profile Status</p>
            <div className="mt-3">
              {profile ? (
                <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-700 font-medium">
                  Complete
                </span>
              ) : (
                <span className="px-3 py-1 text-sm rounded-full bg-red-100 text-red-700 font-medium">
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
          </div>
        </div>

        {showProfileForm && !profile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm">
            {/* Modal Card */}
            <div className="relative w-full max-w-xl rounded-3xl border border-gray-700 bg-gray-950 p-8 shadow-2xl animate-fadeIn">
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
          {/* Quick Actions */}
          <div className="bg-gray-900 rounded-3xl shadow-xl p-8 border-gray-700 border">
            <h2 className="text-2xl font-bold mb-6 text-gray-100">
              Quick Actions
            </h2>
            <div className="space-y-4">
              {[
                {
                  href: "/consultation",
                  title: "Voice Consultation",
                  color: "blue",
                },
                {
                  href: "/prediction",
                  title: "CKD Prediction",
                  color: "green",
                },
                { href: "/reports", title: "Medical Reports", color: "purple" },
              ].map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  className="block p-5 rounded-2xl bg-gray-800 hover:bg-gray-700 transition shadow-sm"
                >
                  <h3 className="font-semibold text-lg text-gray-100">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Access this feature instantly
                  </p>
                </a>
              ))}
            </div>
          </div>

          {/* Recent Labs */}
          <div className="bg-gray-900 rounded-3xl shadow-xl p-8 border-gray-700 border">
            <h2 className="text-2xl font-bold mb-6 text-gray-100">
              Recent Lab Results
            </h2>
            {labResults.length === 0 ? (
              <p className="text-gray-500 text-center py-10">
                No lab results yet
              </p>
            ) : (
              <div className="space-y-4">
                {labResults.slice(0, 5).map((result, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <div>
                      <p className="font-semibold">
                        {formatDate(result.test_date)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Creatinine: {result.serum_creatinine} mg/dL
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      BP: {result.blood_pressure_sys}/
                      {result.blood_pressure_dia}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
