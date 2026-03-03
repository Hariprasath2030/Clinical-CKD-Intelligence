"use client";

import { useState, useEffect } from "react";
import Vapi from "@vapi-ai/web";
import { PhoneCall, PhoneOff, Circle } from "lucide-react";
import { toast } from "sonner";
import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";
import { createConsultation } from "../../services/consultationService";
import {
  runPrediction,
} from "../../services/predictionService";
import PredictionResults from "../../components/ui/PredictionResults";
import ShapChart from "../../components/charts/ShapChart";
import { submitLabResults } from "../../services/patientService";

export default function ConsultationPage() {
  const [callStarted, setCallStarted] = useState(false);
  const [vapiInstance, setVapiInstance] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPredictionPrompt, setShowPredictionPrompt] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [structuredData, setStructuredData] = useState<any>(null);

  let timer: NodeJS.Timeout;

  const StartCall = async () => {
    setLoading(true);

    const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY!);
    setVapiInstance(vapi);

    const config: CreateAssistantDTO = {
      name: "AI Kidney Specialist",
      firstMessage:
        "Hello. Thank you for connecting with this kidney health consultation. May I know your name?",
      transcriber: {
        provider: "assembly-ai",
        language: "en",
      },
      voice: {
        provider: "vapi",
        voiceId: "Elliot",
      },
      model: {
        provider: "openai",
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `
You are a senior consultant kidney specialist conducting a structured medical consultation.

COMMUNICATION STYLE:
- Professional, respectful, and calm.
- No emojis.
- No casual language.
- No abbreviations.
- Always use full medical terminology.
- Ask only ONE question at a time.
- Wait for the patient's response before continuing.
- If a numeric value is unclear, ask for clarification.
- If numeric values are spoken in fragments (for example "four point" then "four"), combine them logically before confirming.
- Always repeat interpreted numeric values for confirmation before proceeding.

CONSULTATION FLOW:

1. After receiving the patient's name, say:
   "Thank you, [Name]. I will ask you a few important questions to assess kidney health."

2. Collect ONLY these mandatory inputs first:
   - Age in years
   - Biological sex
   - Most recent serum creatinine value (in milligrams per deciliter)
   - Most recent systolic blood pressure reading (in millimeters of mercury)
   - Most recent diastolic blood pressure reading (in millimeters of mercury)
   - Most recent glycated hemoglobin test result (percentage)
   - Serum albumin level (grams per deciliter)
   - Body mass index
   - C-reactive protein level (milligrams per liter)
   - Cystatin C level (milligrams per liter)
   - Relevant medical history
   - Current medications

Do NOT proceed to optional questions until ALL mandatory inputs are collected and confirmed.

3. After mandatory inputs are collected and confirmed, ask:
   "Would you like to provide any additional laboratory results such as blood urea, sodium, potassium, calcium, albumin, hemoglobin, body mass index, C-reactive protein, or cystatin C levels?"

If yes, collect them one at a time.
If no, proceed to analysis.

4. Perform clinical assessment using:
   - Serum creatinine
   - Blood pressure
   - Glycated hemoglobin
   - Medical history

Clinical reference ranges:
   - Serum creatinine: approximately 0.6 to 1.3 milligrams per deciliter
   - Normal blood pressure: below 120 over 80
   - Glycated hemoglobin: below 5.7 percent

5. If findings suggest kidney dysfunction:
   Clearly state:
   "There are clinical indicators suggestive of possible kidney dysfunction."
   Provide risk level: Low, Moderate, or High.
   Recommend evaluation by a nephrologist.

If findings appear within acceptable range:
   Clearly state:
   "There is no strong clinical evidence of kidney dysfunction based on the provided information."
   Recommend routine monitoring.

6. End consultation professionally:
   "Thank you for providing your information. If you experience new symptoms or have further concerns, please consult your healthcare provider. I wish you good health."

STRUCTURED OUTPUT REQUIREMENT (MANDATORY):

After completing the consultation, you MUST output a structured JSON object.
This JSON must appear at the end of the conversation.
It must not contain explanations.
It must be valid JSON.

Use EXACTLY this structure:

{
  "age": number or null,
  "biological_sex": string or null,
  "serum_creatinine_mg_per_dl": number or null,
  "systolic_blood_pressure_mm_hg": number or null,
  "diastolic_blood_pressure_mm_hg": number or null,
  "glycated_hemoglobin_percent": number or null,
  "medical_history": string or null,
  "current_medications": string or null,
  "albumin_g_per_dl": number or null,
  "bmi": number or null,
  "crp": number or null,
  "cystatin_c": number or null,
  "risk_level": "Low" | "Moderate" | "High" | null
}

If any value was not provided, set it to null.

You must ALWAYS output this JSON object even if the consultation was incomplete.
`,
          },
        ],
      },
    };

    try {
      await vapi.start(config);
      toast.success("Consultation started");
    } catch {
      toast.error("Failed to start call");
      setLoading(false);
      return;
    }

    vapi.on("call-start", () => {
      setCallStarted(true);
      setDuration(0);
      timer = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    });

    vapi.on("call-end", () => {
      setCallStarted(false);
      clearInterval(timer);
    });

    vapi.on("message", (msg: any) => {
      if (msg.type === "transcript") {
        const { role, transcriptType, transcript } = msg;

        if (transcriptType === "partial") {
          setCurrentRole(role);
          setLiveTranscript(transcript);
        } else {
          setMessages((prev) => [...prev, { role, text: transcript }]);
          setLiveTranscript("");
          setCurrentRole(null);
        }
      }
    });

    setLoading(false);
  };

  const EndCall = async () => {
    if (!vapiInstance) return;

    vapiInstance.stop();
    vapiInstance.removeAllListeners();
    setCallStarted(false);

    // const fullConversation =
    //   "assistant: Hello. Thank you for connecting with this kidney health consultation.\nassistant: May I know your name?\nuser: My name is aripas.\nuser: At.\nassistant: Thank you, Aripas. I will ask you a few important questions.\nassistant: To assess kidney health.\nassistant: May I know your age and years?\nuser: My age is 22.\nassistant: Thank you for confirming your age as 22 years.\nassistant: Could you please provide your biological sex?\nuser: L ra.\nassistant: Thank you. Could you please confirm if your biological sex is female?\nuser: Il.\nassistant: Thank you for confirming your biological sex as male.\nassistant: Could you share your most recent serum creatinine value in milligrams per deciliter?\nuser: Two point.\nuser: Two.\nassistant: Thank you.\nassistant: To confirm. Your most recent serum creatinine value is 2.2 milligrams per deciliter.\nassistant: Please let me know if this was accurate.\nuser: 30.\nuser: Four.\nassistant: To confirm your most recent serum creatinine value.\nassistant: Was at 1.34 milligrams per deciliter.\nuser: You're correct.\nassistant: Thank you for confirming your serum creatinine value as 1.34 milligrams per deciliter.\nassistant: Could you now provide your most recent systolic blood pressure reading in millimeters of mercury?\nuser: It is 4.4.\nassistant: It seems there may be a misunderstanding. Could you clarify your most recent systolic blood pressure value?\nuser: 20.4.\nassistant: Thank you. To clarify, is your systolic blood pressure reading 120 millimeters of mercury?\nuser: Yeah.\nassistant: Thank you for confirming your systolic blood pressure as 120 millimeters of mercury.\nassistant: Could you now provide your most recent diastolic blood pressure reading in millimeters of mercury?\nuser: 140.\nassistant: It seems there may be a misunderstanding. Could you please confirm your diastolic blood pressure reading?\nuser: Six.\nuser: 60.\nassistant: Thank you. To confirm, your most recent diastolic blood pressure reading is 60 millimeters of mercury.\nassistant: Please let me know if this is correct.\nuser: Yeah, it's correct.\nassistant: Thank you for confirming your diastolic blood pressure as 60 millimeters of mercury.\nassistant: Could you now provide your most recent glycated hemoglobin test result in percentage?\nuser: 10.1.\nassistant: To confirm, your most recent glycated hemoglobin test result is 10.1 percent.\nassistant: Please let me know if this interpretation is correct.\nuser: Yes.\nassistant: Thank you for confirming your glycated hemoglobin test result as 10.1 percent.\nassistant: Please provide your serum albumin level in grams per deciliter.\nuser: Three.\nassistant: To confirm, your serum albumin level is 3 grams per deciliter.\nuser: Three point eight.\nassistant: Thank you for the clarification. To confirm, your serum albumin level is 3.8 grams per deciliter.\nuser: Yes.\nassistant: Thank you for confirming your serum albumin level as 3.8 grams per deciliter.\nassistant: Could you now provide your body mass index?\nuser: Twenty.\nassistant: To confirm, your body mass index is 20.\nuser: 24.5.\nassistant: Thank you for the correction. To confirm, your body mass index is 24.5.\nuser: Correct.\nassistant: Thank you for confirming your body mass index as 24.5.\nassistant: Could you now provide your C-reactive protein level in milligrams per liter?\nuser: Five.\nassistant: To confirm, your C-reactive protein level is 5 milligrams per liter.\nuser: Five point two.\nassistant: Thank you for the clarification. To confirm, your C-reactive protein level is 5.2 milligrams per liter.\nuser: Yes.\nassistant: Thank you for confirming your C-reactive protein level as 5.2 milligrams per liter.\nassistant: Finally, could you provide your cystatin C level in milligrams per liter?\nuser: One.\nassistant: To confirm, your cystatin C level is 1 milligram per liter.\nuser: One point eight.\nassistant: Thank you for the clarification. To confirm, your cystatin C level is 1.8 milligrams per liter.\nuser: Yes, correct.";
    try {
      const fullConversation = messages
        .map((m) => `${m.role}: ${m.text}`)
        .join("\n");

      const patientTranscript = messages
        .filter((m) => m.role === "user")
        .map((m) => m.text)
        .join(" ");

      const extractNumber = (text: string, pattern: RegExp) => {
        const match = text.match(pattern);
        return match ? Number(match[1]) : null;
      };

      const transcript = fullConversation;
      const age = extractNumber(transcript, /age as (\d+)/i);
      const creatinine = extractNumber(
        transcript,
        /serum creatinine value as (\d+(\.\d+)?)/i,
      );
      const systolic = extractNumber(
        transcript,
        /systolic blood pressure as (\d+)/i,
      );
      const diastolic = extractNumber(
        transcript,
        /diastolic blood pressure as (\d+)/i,
      );
      const hba1c = extractNumber(
        transcript,
        /glycated hemoglobin.*?(\d+(\.\d+)?)/i,
      );
      const albumin = extractNumber(transcript, /albumin.*?(\d+(\.\d+)?)/i);

      const bmi = extractNumber(transcript, /body mass index.*?(\d+(\.\d+)?)/i);

      const crp = extractNumber(
        transcript,
        /c-reactive protein.*?(\d+(\.\d+)?)/i,
      );

      const cystatinC = extractNumber(
        transcript,
        /cystatin c.*?(\d+(\.\d+)?)/i,
      );
      const sexMatch = transcript.match(/biological sex as (\w+)/i);
      const sex = sexMatch ? sexMatch[1] : null;

      const structured = {
        age,
        sex,
        serum_creatinine: creatinine,
        systolic_blood_pressure: systolic,
        diastolic_blood_pressure: diastolic,
        glycated_hemoglobin: hba1c,
        albumin: albumin,
        bmi,
        crp,
        cystatin_c: cystatinC,
      };
      await createConsultation({
        input_type: "voice",
        raw_input: fullConversation,
        transcription: patientTranscript,
        structured_data: structured || {},
      });
      setStructuredData(structured);
      toast.success("Consultation saved successfully");

      if (structured) {
        setShowPredictionPrompt(true);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save consultation");
    }
    setVapiInstance(null);
    setMessages([]);
    setLiveTranscript("");
    setDuration(0);
  };

  const handleRunPrediction = async () => {
    if (!structuredData) return;

    try {
      setLoading(true);
      setShowPredictionPrompt(false);

      const payload = {
        test_date: new Date().toISOString(),
        age: structuredData?.age ? Number(structuredData.age) : null,
        sex: structuredData?.sex || null,
        serum_creatinine: structuredData?.serum_creatinine
          ? Number(structuredData.serum_creatinine)
          : null,
        hba1c: structuredData?.glycated_hemoglobin
          ? Number(structuredData.glycated_hemoglobin)
          : null,
        blood_pressure_sys: structuredData?.systolic_blood_pressure
          ? Number(structuredData.systolic_blood_pressure)
          : null,
        blood_pressure_dia: structuredData?.diastolic_blood_pressure
          ? Number(structuredData.diastolic_blood_pressure)
          : null,
        albumin: structuredData?.albumin
          ? Number(structuredData.albumin)
          : null,
        bmi: structuredData?.bmi ? Number(structuredData.bmi) : null,
        crp: structuredData?.crp ? Number(structuredData.crp) : null,
        cystatin_c: structuredData?.cystatin_c
          ? Number(structuredData.cystatin_c)
          : null,
      };

      await submitLabResults(payload);
      const response = await runPrediction(payload);

      setPrediction(response.data);
    } catch {
      toast.error("Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!prediction) return;
    if (Number(prediction.ckd_stage) >= 4) {
      setShowAlert(true);
    }
  }, [prediction]);

  return (
    <div className="min-h-screen bg-black text-white px-6 py-6">
      <div className="relative mb-6 rounded-3xl border border-neutral-800 bg-gradient-to-br from-neutral-950 via-black to-neutral-950 p-12 shadow-[0_0_80px_rgba(59,130,246,0.08)] overflow-hidden">
        {/* Neon blurred circles */}
        <div className="absolute -top-32 -left-32 h-[400px] w-[400px] bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text">
            🩺 AI Kidney Specialist Consultation
          </h1>
          <p className="mt-4 text-gray-400 text-lg max-w-3xl mx-auto md:mx-0 leading-relaxed">
            Discuss your symptoms with our intelligent nephrology assistant. Get
            structured clinical insights and next-step medical guidance in
            real-time.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-900 via-black to-neutral-950 p-6 shadow-[0_0_40px_rgba(59,130,246,0.08)] backdrop-blur-xl">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-cyan-500/10 blur-3xl rounded-full" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 blur-3xl rounded-full" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <span
                  className={`absolute inline-flex h-4 w-4 rounded-full ${
                    callStarted ? "bg-green-500 animate-ping" : "bg-red-500"
                  }`}
                />
                <span
                  className={`relative inline-flex h-4 w-4 rounded-full ${
                    callStarted ? "bg-green-500" : "bg-red-500"
                  }`}
                />
              </div>

              <div>
                <p className="text-sm text-gray-400">Session Status</p>
                <p className="font-semibold text-lg">
                  {callStarted
                    ? "Live Consultation Active"
                    : "Awaiting Connection"}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-400">Duration</p>
              <p className="font-mono text-2xl tracking-wider text-cyan-400">
                {new Date(duration * 1000).toISOString().substr(14, 5)}
              </p>
            </div>
          </div>

          {/* Chat Window */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-cyan-500/10 blur-3xl rounded-full" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-500/10 blur-3xl rounded-full" />
          <div className="relative z-10 text-center">
            <div className="relative mx-auto w-32 h-32 mb-6 flex items-center justify-center">
              {callStarted && (
                <div className="absolute w-40 h-40 rounded-full border border-cyan-500/40 animate-pulse" />
              )}

              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-5xl shadow-inner">
                🩺
              </div>
            </div>

            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              AI Kidney Specialist
            </h2>

            <p className="text-gray-400 mt-2 text-sm tracking-wide">
              Intelligent Nephrology Voice Consultation System
            </p>

            <div className="mt-8 bg-black/40 border border-white/10 rounded-2xl p-6 max-h-72 overflow-y-auto backdrop-blur-md shadow-inner text-left space-y-3">
              {messages.slice(-6).map((msg, index) => (
                <div
                  key={index}
                  className={`text-sm ${
                    msg.role === "assistant" ? "text-cyan-300" : "text-gray-300"
                  }`}
                >
                  <span className="font-semibold capitalize">
                    {msg.role === "assistant" ? "Doctor" : "Patient"}:
                  </span>{" "}
                  {msg.text}
                </div>
              ))}

              {liveTranscript && (
                <div className="italic text-gray-500 text-sm">
                  {currentRole === "assistant" ? "Doctor" : "Patient"}:{" "}
                  {liveTranscript}
                </div>
              )}
            </div>

            <div className="mt-10 relative">
              {!callStarted ? (
                <button
                  onClick={StartCall}
                  disabled={loading}
                  className="relative w-full group overflow-hidden rounded-2xl px-6 py-4 font-semibold text-lg transition-all duration-300"
                >
                  <span className="absolute inset-0 rounded-2xl bg-black opacity-70 blur-lg group-hover:opacity-100 transition" />
                  <span className="relative flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 text-white shadow-lg transition-all duration-300 group-hover:scale-[1.02] group-active:scale-[0.98]">
                    {loading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Establishing Secure Connection...
                      </>
                    ) : (
                      <>
                        <PhoneCall className="w-5 h-5" />
                        Initiate Consultation
                      </>
                    )}
                  </span>
                </button>
              ) : (
                <button
                  onClick={EndCall}
                  className="relative w-full group overflow-hidden rounded-2xl px-6 py-4 font-semibold text-lg transition-all duration-300"
                >
                  <span className="absolute inset-0 rounded-2xl bg-black opacity-70 blur-lg animate-pulse" />

                  <span className="relative flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4 text-white shadow-lg transition-all duration-300 group-hover:scale-[1.02] group-active:scale-[0.98]">
                    <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
                    <PhoneOff className="w-5 h-5" />
                    Terminate Consultation
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-950 via-black to-neutral-950 p-10 shadow-[0_0_60px_rgba(59,130,246,0.08)]">
          <h2 className="text-2xl font-semibold text-cyan-400 mb-6">
            Stage-wise CKD Prediction
          </h2>

          {!prediction && (
            <div className="text-gray-500 space-y-3">
              <p>
                The prediction will be generated based on the completed clinical
                consultation and collected biomarker data.
              </p>
              <p className="text-sm text-gray-600">
                Please complete the voice consultation and confirm all mandatory
                laboratory values to enable stage-wise Chronic Kidney Disease
                risk assessment.
              </p>
            </div>
          )}

          {prediction && <PredictionResults result={prediction} />}
          {/* {prediction.top_contributing_features && (
            <ShapChart features={prediction.top_contributing_features} />
          )} */}
        </div>
      </div>

      {prediction?.recommendations && (
        <div className="mt-12 rounded-3xl border border-gray-800 p-10 bg-gradient-to-br from-neutral-950 via-black to-neutral-950 shadow-[0_0_60px_rgba(0,255,255,0.05)]">
          <h2 className="text-2xl font-semibold text-cyan-400 mb-6">
            Clinical Recommendations
          </h2>

          <ul className="space-y-3 text-gray-300">
            {prediction.recommendations.map((rec: string, index: number) => (
              <li key={index}>• {rec}</li>
            ))}
          </ul>
        </div>
      )}
      {showPredictionPrompt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-gray-950 border border-blue-600 rounded-3xl p-10 max-w-lg w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-blue-400 mb-4">
              Kidney Disease Stage-wise Prediction
            </h3>

            <p className="text-gray-300 mb-6 leading-relaxed">
              The clinical consultation has been completed successfully. Would
              you like to generate a stage-wise Chronic Kidney Disease
              prediction based on the collected biomarkers and clinical inputs?
            </p>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowPredictionPrompt(false)}
                className="px-5 py-2 rounded-xl border border-gray-600 hover:bg-gray-800 transition"
              >
                No, Skip
              </button>

              <button
                onClick={handleRunPrediction}
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 transition font-semibold"
              >
                Yes, Generate Prediction
              </button>
            </div>
          </div>
        </div>
      )}
      {showAlert && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-950 border border-red-600 rounded-3xl p-10 max-w-md w-full text-center">
            <h3 className="text-2xl font-bold text-red-500 mb-4">
              High CKD Stage Detected
            </h3>
            <p>
              Stage four or higher detected. Immediate nephrology consultation
              recommended.
            </p>
            <button
              onClick={() => setShowAlert(false)}
              className="mt-6 px-6 py-2 bg-red-600 rounded-xl"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
      {loading && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-blue-500"></div>
        </div>
      )}
    </div>
  );
}
