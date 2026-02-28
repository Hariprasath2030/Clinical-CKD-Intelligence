"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "../../services/authService";
import { clearToken } from "../../lib/auth";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await getCurrentUser();
        setUser(response.data);
      } catch (err) {
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
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <a href="/" className="flex items-center">
              <span className="text-xl font-bold text-blue-600">CKD Intelligence</span>
            </a>

            {user && (
              <div className="hidden md:ml-10 md:flex md:space-x-8">
                <a
                  href={user.role_id === 1 ? "/dashboard/patient" : "/dashboard/doctor"}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  Dashboard
                </a>
                {user.role_id === 1 && (
                  <>
                    <a
                      href="/consultation"
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                    >
                      Consultation
                    </a>
                    <a
                      href="/prediction"
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                    >
                      Prediction
                    </a>
                    <a
                      href="/reports"
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                    >
                      Reports
                    </a>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600"
                >
                  <span className="text-sm font-medium">{user.full_name}</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-x-4">
                <a
                  href="/auth/login"
                  className="text-gray-700 hover:text-blue-600 text-sm font-medium"
                >
                  Login
                </a>
                <a
                  href="/auth/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Register
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
