"use client";

import React from "react";

interface BiomarkerInputProps {
  stage?: string;
  onSubmit?: (data: any) => void;
}

export default function ClinicalDataInput({
  stage,
  onSubmit,
}: BiomarkerInputProps) {
  const [formData, setFormData] = React.useState({
    serumCreatinine: "",
    cystatinC: "",
    bloodPressure: "",
    age: "",
    sex: "M",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <h2 className="text-xl font-semibold">Clinical Data Input</h2>

      <div>
        <label className="block text-sm font-medium">
          Serum Creatinine (mg/dL)
        </label>
        <input
          type="number"
          name="serumCreatinine"
          value={formData.serumCreatinine}
          onChange={handleChange}
          className="w-full mt-1 rounded border px-3 py-2"
          placeholder="e.g. 1.2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Cystatin C (mg/L)</label>
        <input
          type="number"
          name="cystatinC"
          value={formData.cystatinC}
          onChange={handleChange}
          className="w-full mt-1 rounded border px-3 py-2"
          placeholder="e.g. 0.8"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">
          Blood Pressure (mmHg)
        </label>
        <input
          type="text"
          name="bloodPressure"
          value={formData.bloodPressure}
          onChange={handleChange}
          className="w-full mt-1 rounded border px-3 py-2"
          placeholder="e.g. 120/80"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Age</label>
        <input
          type="number"
          name="age"
          value={formData.age}
          onChange={handleChange}
          className="w-full mt-1 rounded border px-3 py-2"
          placeholder="e.g. 45"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Sex</label>
        <select
          name="sex"
          value={formData.sex}
          onChange={handleChange}
          className="w-full mt-1 rounded border px-3 py-2"
        >
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>
      </div>

      <button
        type="submit"
        className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700"
      >
        Submit & Get Prediction
      </button>
    </form>
  );
}
