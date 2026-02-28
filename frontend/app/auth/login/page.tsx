"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "../../../services/authService";
import { saveToken } from "../../../lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resp = await login({ email, password });
      saveToken(resp.data.access_token);
      router.push("/dashboard/patient");
    } catch (err: any) {
      setError("Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Login</h1>
      {error && <p className="text-red-500">{error}</p>}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700"
        >
          Log in
        </button>
      </form>
    </div>
  );
}
