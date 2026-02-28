"use client";

import { useState } from "react";
import { runPrediction } from "../../services/predictionService";
import ClinicalDataInput from "../../components/ui/ClinicalDataInput";
import PredictionResults from "../../components/ui/PredictionResults";
import ShapChart from "../../components/charts/ShapChart";
import EgfrTrendChart from "../../components/charts/EgfrTrendChart";

export default function PredictionPage() {
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    setError("");

    try {
      const payload = {
        test_date: new Date().toISOString(),
        serum_creatinine: parseFloat(formData.serumCreatinine),
        cystatin_c: parseFloat(formData.cystatinC) || null,
        blood_pressure_sys:
          parseInt(formData.bloodPressure.split("/")[0]) || null,
        blood_pressure_dia:
          parseInt(formData.bloodPressure.split("/")[1]) || null,
      };

      const response = await runPrediction(payload);
      setPrediction(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Prediction failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">eGFR Prediction & CKD Staging</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <ClinicalDataInput onSubmit={handleSubmit} />

          {loading && (
            <div className="mt-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Analyzing...</p>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>

        {prediction && (
          <div className="space-y-6">
            <PredictionResults result={prediction} />

            {prediction.top_contributing_features && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Feature Importance (SHAP)
                </h3>
                <ShapChart features={prediction.top_contributing_features} />
              </div>
            )}
          </div>
        )}
      </div>

      {prediction && prediction.recommendations && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Clinical Recommendations
          </h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 mb-4">{prediction.clinical_guidance}</p>
            <ul className="space-y-2">
              {prediction.recommendations.map((rec: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
