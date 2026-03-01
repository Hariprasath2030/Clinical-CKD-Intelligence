"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "../../services/authService";
import { clearToken } from "../../lib/auth";
import Link from "next/link";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await getCurrentUser();
        setUser(response.data);
      } catch {
        setUser(null);
      }
    }
    loadUser();
  }, []);

  const handleLogout = () => {
    clearToken();
    setUser(null);
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-lg bg-black border-b border-zinc-800">
      <div className="mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-white tracking-tight">
            CKD <span className="text-blue-500">Intelligence</span>
          </Link>

          {user && (
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
              <Link
                href={user.role_id === 1 ? "/dashboard/patient" : "/dashboard/doctor"}
                className="hover:text-white transition"
              >
                Dashboard
              </Link>

              {user.role_id && (
                <>
                  <Link href="/consultation" className="hover:text-white transition">
                    Consultation
                  </Link>
                  <Link href="/prediction" className="hover:text-white transition">
                    Prediction
                  </Link>
                  <Link href="/reports" className="hover:text-white transition">
                    Reports
                  </Link>
                </>
              )}
            </div>
          )}

          <div className="flex items-center gap-4">
            {!user && (
              <div className="hidden md:flex items-center gap-4">
                <Link
                  href="/auth/login"
                  className="text-zinc-300 hover:text-white transition text-sm"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-blue-600/30 transition"
                >
                  Get Started
                </Link>
              </div>
            )}

            {user && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white transition"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {user.full_name?.charAt(0)}
                  </div>
                  <span className="hidden md:block">{user.full_name}</span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-3 w-52 bg-neutral-900 border border-zinc-800 rounded-xl shadow-xl py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition rounded-lg"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-zinc-300"
            >
              ☰
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-6 space-y-4 text-zinc-300 text-sm">
            {user ? (
              <>
                <Link
                  href={user.role_id === 1 ? "/dashboard/patient" : "/dashboard/doctor"}
                  className="block hover:text-white"
                >
                  Dashboard
                </Link>
                {user.role_id && (
                  <>
                    <Link href="/consultation" className="block hover:text-white">
                      Consultation
                    </Link>
                    <Link href="/prediction" className="block hover:text-white">
                      Prediction
                    </Link>
                    <Link href="/reports" className="block hover:text-white">
                      Reports
                    </Link>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="block text-left hover:text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="block hover:text-white">
                  Login
                </Link>
                <Link href="/auth/register" className="block hover:text-white">
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}