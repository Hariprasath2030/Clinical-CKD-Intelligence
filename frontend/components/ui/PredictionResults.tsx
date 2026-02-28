"use client";

// This component now expects the raw prediction object returned from backend
// so we can display fields without remapping at the call site.
interface PredictionResult {
  egfr_predicted: number;
  ckd_stage: string;
  egfr_confidence: number;
  risk_level: string;
  clinical_guidance?: string;
  recommendations?: string[];
}

interface Props {
  result: PredictionResult;
}

const stageConfig: Record<
  string,
  { bg: string; text: string; recommendation: string }
> = {
  "1": {
    bg: "bg-green-100",
    text: "text-green-900",
    recommendation:
      "Your kidney function is normal. Continue healthy lifestyle practices.",
  },
  "2": {
    bg: "bg-yellow-100",
    text: "text-yellow-900",
    recommendation:
      "Mildly reduced kidney function. Monitor regularly and consult your doctor.",
  },
  "3": {
    bg: "bg-orange-100",
    text: "text-orange-900",
    recommendation:
      "Moderately reduced kidney function. Follow your doctor's guidance closely.",
  },
  "4": {
    bg: "bg-red-100",
    text: "text-red-900",
    recommendation:
      "Severely reduced kidney function. Urgent consultation needed.",
  },
  "5": {
    bg: "bg-red-200",
    text: "text-red-950",
    recommendation: "Kidney failure. Immediate medical attention required.",
  },
};

export default function PredictionResults({ result }: Props) {
  // translate API fields into the stage key and display values
  const stage = result.ckd_stage;
  const config = stageConfig[stage] || stageConfig["1"];

  return (
    <div className={`rounded-lg p-6 ${config.bg} ${config.text}`}>
      <h2 className="text-2xl font-semibold">Prediction Results</h2>
      <div className="mt-4 space-y-2">
        <p>
          <strong>Predicted eGFR:</strong> {result.egfr_predicted.toFixed(2)}{" "}
          mL/min/1.73m²
        </p>
        <p>
          <strong>CKD Stage:</strong> Stage {stage}
        </p>
        <p>
          <strong>Confidence:</strong>{" "}
          {(result.egfr_confidence * 100).toFixed(1)}%
        </p>
        <p>
          <strong>Risk Level:</strong> {result.risk_level}
        </p>
      </div>
      <p className="mt-4">{config.recommendation}</p>
    </div>
  );
}
