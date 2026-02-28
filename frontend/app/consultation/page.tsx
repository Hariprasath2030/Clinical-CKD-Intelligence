"use client";

import { useState } from "react";
import VoiceConsultation from "../../components/voice/VoiceConsultation";
import { createConsultation } from "../../services/consultationService";

export default function ConsultationPage() {
  const [textInput, setTextInput] = useState("");
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    setLoading(true);
    try {
      const response = await createConsultation({
        input_type: "text",
        raw_input: textInput,
        structured_data: { text: textInput },
      });
      setConsultations([response.data, ...consultations]);
      setTextInput("");
    } catch (err) {
      console.error("Failed to submit consultation", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Consultation</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <VoiceConsultation />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Text Input</h2>
          <form onSubmit={handleTextSubmit} className="space-y-4">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="w-full h-32 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your symptoms or concerns..."
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Consultation History</h2>
        {consultations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No consultations yet</p>
        ) : (
          <div className="space-y-4">
            {consultations.map((consultation) => (
              <div key={consultation.id} className="border-l-4 border-blue-500 pl-4 py-3">
                <p className="text-sm text-gray-500">
                  {new Date(consultation.created_at).toLocaleString()}
                </p>
                <p className="mt-1 text-gray-900">
                  {consultation.transcription || consultation.raw_input}
                </p>
                <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                  {consultation.input_type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
