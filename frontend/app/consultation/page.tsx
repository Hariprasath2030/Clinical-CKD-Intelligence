"use client";

import { useState } from "react";
import Vapi from "@vapi-ai/web";
import { PhoneCall, PhoneOff, Circle } from "lucide-react";
import { toast } from "sonner";
import Button from "../../components/ui/Button";
import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";

export default function ConsultationPage() {
  const [callStarted, setCallStarted] = useState(false);
  const [vapiInstance, setVapiInstance] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);

  let timer: NodeJS.Timeout;

  const StartCall = async () => {
    setLoading(true);

    const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY!);
    setVapiInstance(vapi);

    const config: CreateAssistantDTO = {
      name: "AI Kidney Specialist",
      firstMessage:
        "Hi, I am your AI Kidney Specialist. Tell me what symptoms you're experiencing.",
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
- No abbreviations. Always use full medical terms.
  For example:
  Say "glycated hemoglobin test" instead of "HbA1c".
  Say "blood pressure" instead of "BP".
- Ask only ONE question at a time.
- Wait for the patient's response before continuing.
- If a numeric value is required and the patient gives an unclear answer, politely ask for clarification.

CONSULTATION FLOW:

1. Begin with a professional greeting:
   "Hello. Thank you for connecting with this kidney health consultation. May I know your name?"

2. After receiving the name, acknowledge it:
   "Thank you, [Name]. I will ask you a few important questions to assess kidney health."

3. Collect ONLY these mandatory inputs first:
   - Age in years
   - Biological sex
   - Most recent serum creatinine value (in milligrams per deciliter)
   - Most recent systolic blood pressure reading (in millimeters of mercury)
   - Most recent diastolic blood pressure reading (in millimeters of mercury)
   - Most recent glycated hemoglobin test result (percentage)
   - Relevant medical history
   - Current medications

Do not ask optional inputs until all mandatory inputs are collected.

4. After mandatory inputs are completed, ask:
   "Would you like to provide any additional laboratory results such as blood urea, sodium, potassium, calcium, albumin, or hemoglobin levels?"

If the patient says yes, collect them one at a time.
If the patient says no, proceed to analysis.

5. Perform an initial kidney function assessment using:
   - Serum creatinine
   - Blood pressure readings
   - Glycated hemoglobin result
   - Medical history

Use standard clinical ranges:
   - Serum creatinine approximately 0.6 to 1.3 milligrams per deciliter
   - Normal blood pressure below 120 over 80
   - Glycated hemoglobin below 5.7 percent

6. If findings suggest kidney dysfunction:
   Clearly state:
   "There are clinical indicators suggestive of possible kidney dysfunction."
   Provide risk level: Low, Moderate, or High.
   Recommend further evaluation with a nephrologist.

If findings appear within acceptable range:
   Clearly state:
   "There is no strong clinical evidence of kidney dysfunction based on the provided information."
   Recommend routine monitoring.

7. End consultation professionally:
   "Thank you for providing your information. If you experience new symptoms or have further concerns, please consult your healthcare provider. I wish you good health."
`,
          },
        ],
      },
    };
    try {
      await vapi.start(config);
      toast.success("Call Connected");
    } catch (err) {
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
    setVapiInstance(null);
    setCallStarted(false);
    setMessages([]);
    setLiveTranscript("");
    setDuration(0);

    toast.success("Consultation Ended");
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
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
      {/* STATUS BAR */}
      <div className="flex items-center justify-between w-full max-w-xl mb-6">
        <div className="flex items-center gap-2">
          <Circle
            className={`w-4 h-4 ${
              callStarted ? "text-green-500" : "text-red-500"
            }`}
          />
          <span>{callStarted ? "Connected" : "Not Connected"}</span>
        </div>

        <div className="font-mono text-lg">
          {new Date(duration * 1000).toISOString().substr(14, 5)}
        </div>
      </div>

      {/* AI DOCTOR CARD */}
      <div className="bg-neutral-900 border border-cyan-500/20 rounded-3xl p-8 shadow-xl w-full max-w-xl text-center">
        <div className="w-28 h-28 mx-auto bg-cyan-500/20 rounded-full flex items-center justify-center text-4xl mb-4">
          🩺
        </div>

        <h2 className="text-xl font-bold text-cyan-400">
          AI Kidney Specialist
        </h2>

        <p className="text-gray-400 text-sm mt-1">
          Real-time Clinical Voice Assistant
        </p>

        {/* LIVE TRANSCRIPT */}
        <div className="mt-6 max-h-64 overflow-y-auto text-left space-y-2">
          {messages.slice(-6).map((msg, index) => (
            <p key={index} className="text-sm">
              <span className="capitalize font-semibold">{msg.role}:</span>{" "}
              {msg.text}
            </p>
          ))}

          {liveTranscript && (
            <p className="text-sm italic opacity-70">
              {currentRole}: {liveTranscript}
            </p>
          )}
        </div>

        {/* CALL BUTTON */}
        {!callStarted ? (
          <Button
            className="mt-8 bg-green-600 hover:bg-green-700 w-full"
            onClick={StartCall}
            disabled={loading}
          >
            {loading ? (
              "Connecting..."
            ) : (
              <>
                <PhoneCall className="mr-2" /> Start Consultation
              </>
            )}
          </Button>
        ) : (
          <Button
            className="mt-8 bg-red-600 hover:bg-red-700 w-full"
            onClick={EndCall}
          >
            <PhoneOff className="mr-2" /> End Consultation
          </Button>
        )}
      </div>
    </div>
  );
}
