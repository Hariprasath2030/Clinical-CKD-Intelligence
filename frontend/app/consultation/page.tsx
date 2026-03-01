"use client";

import { useState, useEffect } from "react";
import VoiceConsultation from "../../components/voice/VoiceConsultation";
import {
  createConsultation,
  getConsultations,
} from "../../services/consultationService";

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

      setConsultations((prev) => [response.data, ...prev]);
      setTextInput("");
    } catch (err) {
      console.error("Failed to submit consultation", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const response = await getConsultations();
      setConsultations(response.data.reverse()); // newest first
    } catch (err) {
      console.error("Failed to load consultations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      {/* HEADER */}
      <div className="relative mb-12 rounded-3xl border border-neutral-800 bg-gradient-to-br from-neutral-950 via-black to-neutral-950 p-12 shadow-[0_0_80px_rgba(59,130,246,0.08)] overflow-hidden">
        {/* Neon blurred circles */}
        <div className="absolute -top-32 -left-32 h-[400px] w-[400px] bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] bg-blue-500/10 rounded-full blur-3xl" />

        {/* Header content */}
        <div className="relative z-10 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            🩺 AI Kidney Specialist Consultation
          </h1>
          <p className="mt-4 text-gray-400 text-lg max-w-3xl mx-auto md:mx-0 leading-relaxed">
            Discuss your symptoms with our intelligent nephrology assistant. Get
            structured clinical insights and next-step medical guidance in
            real-time.
          </p>
        </div>
      </div>

      {/* Specialist Card */}
      <div className="bg-neutral-950/70 backdrop-blur-lg border border-cyan-500/20 rounded-2xl p-6 mb-10 shadow-xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-cyan-500/20 flex items-center justify-center text-xl">
            🩺
          </div>
          <div>
            <h2 className="text-lg font-semibold text-cyan-400">
              Dr. AI NephroCare
            </h2>
            <p className="text-sm text-gray-400">
              Virtual Kidney Specialist · CKD Risk & eGFR Analysis
            </p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12 mx-auto">
        {/* Voice Consultation */}
        <div className="bg-neutral-950 border border-white/10 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-cyan-400">
            🎙 Voice Consultation
          </h2>
          <VoiceConsultation />
        </div>

        {/* Text Consultation */}
        <div className="bg-neutral-950 border border-white/10 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-cyan-400">
            💬 Text Consultation
          </h2>
          <form onSubmit={handleTextSubmit} className="space-y-4">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="w-full h-36 bg-neutral-800 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none text-white"
              placeholder="Describe symptoms, duration, lab values, or concerns..."
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-700 transition-all duration-300 py-3 rounded-xl font-medium disabled:opacity-50"
            >
              {loading ? "Analyzing Clinical Data..." : "Start Consultation"}
            </button>
          </form>
        </div>
      </div>

      {/* Consultation History */}
      <div className="bg-neutral-950 border border-white/10 rounded-2xl p-8 shadow-lg mx-auto">
        <h2 className="text-2xl font-semibold mb-6 text-cyan-400">
          🗂 Consultation History
        </h2>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div>
          </div>
        ) : consultations.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            No consultations found.
          </p>
        ) : (
          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
            {consultations.map((consultation) => (
              <div
                key={consultation.id}
                className="bg-neutral-800 border border-white/10 rounded-xl p-5 hover:border-cyan-500/40 transition"
              >
                <p className="text-xs text-gray-500 mb-2">
                  {new Date(consultation.created_at).toLocaleString()}
                </p>
                <p className="text-gray-200">
                  {consultation.transcription || consultation.raw_input}
                </p>
                <div className="mt-3">
                  <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-cyan-500/20 text-cyan-400 capitalize">
                    {consultation.input_type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
