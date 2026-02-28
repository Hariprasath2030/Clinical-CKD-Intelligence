"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "../../../services/authService";
import { getProfile } from "../../../services/patientService";
import { getLabResults } from "../../../services/patientService";
import ClinicalDataInput from "../../../components/ui/ClinicalDataInput";
import { formatDate } from "../../../lib/utils";

export default function PatientDashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [labResults, setLabResults] = useState<any[]>([]);
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back, {user?.full_name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Tests</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{labResults.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Latest eGFR</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {labResults[0]?.serum_creatinine ? "Available" : "N/A"}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Profile Status</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {profile ? "Complete" : "Incomplete"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/consultation"
              className="block w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
            >
              <h3 className="font-medium text-blue-900">Voice Consultation</h3>
              <p className="text-sm text-blue-700">Speak with our AI assistant</p>
            </a>

            <a
              href="/prediction"
              className="block w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition"
            >
              <h3 className="font-medium text-green-900">Get Prediction</h3>
              <p className="text-sm text-green-700">Submit lab data for analysis</p>
            </a>

            <a
              href="/reports"
              className="block w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
            >
              <h3 className="font-medium text-purple-900">View Reports</h3>
              <p className="text-sm text-purple-700">Access your medical reports</p>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Lab Results</h2>
          {labResults.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No lab results yet</p>
          ) : (
            <div className="space-y-4">
              {labResults.slice(0, 5).map((result, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="font-medium">Test Date: {formatDate(result.test_date)}</p>
                  <p className="text-sm text-gray-600">
                    SCr: {result.serum_creatinine} mg/dL
                  </p>
                  <p className="text-sm text-gray-600">
                    BP: {result.blood_pressure_sys}/{result.blood_pressure_dia} mmHg
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
