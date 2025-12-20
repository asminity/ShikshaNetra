"use client";

<<<<<<< HEAD
import React, { Suspense } from "react";
import { AuthPage } from "@/components/auth/AuthPage";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-100">Loading...</div>}>
      <AuthPage initialMode="login" />
    </Suspense>
=======
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/Card";
import { useToast } from "@/components/ToastContext";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string>("");

  useEffect(() => {
    // Redirect if already logged in
    const token = localStorage.getItem("shikshanetra_token");
    const loggedIn = localStorage.getItem("shikshanetra_logged_in") === "true";
    if (token || loggedIn) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    const nextErrors: typeof errors = {};
    if (!email) nextErrors.email = "Email is required.";
    if (!password) nextErrors.password = "Password is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);

    try {
      // Call the authentication API
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        setApiError(error.error || "Login failed. Please try again.");
        return;
      }

      const data = await response.json();

      // Store tokens and user info
      localStorage.setItem("shikshanetra_token", data.accessToken);
      localStorage.setItem("shikshanetra_user", JSON.stringify(data.user));
      localStorage.setItem("shikshanetra_logged_in", "true");

      showToast("Login successful. Redirecting...");
      
      // Redirect based on role
      if (data.user.role === "Institution Admin") {
        router.push("/institution/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      setApiError(error instanceof Error ? error.message : "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-1 bg-slate-50">
      <div className="flex flex-col justify-center items-center p-6 lg:p-10">
        
        <div className="w-full max-w-[440px] space-y-8">
            <div className="text-center space-y-2">
               <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm border border-slate-200 mb-4">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>AI Mentor Evaluation Platform</span>
               </div>
               <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Welcome back
               </h1>
               <p className="text-base text-slate-500">
                  Log in to your account
               </p>
            </div>

            <Card className="bg-white border border-slate-200 shadow-xl p-8 rounded-2xl">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {apiError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex gap-2 items-center text-sm text-red-700 animate-in fade-in slide-in-from-top-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0"></div>
                      <p className="font-medium">{apiError}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                      {/* Email */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-900">
                          Email
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@institution.edu"
                          className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition-all focus:border-slate-800 focus:ring-1 focus:ring-slate-800 hover:border-slate-400"
                        />
                        {errors.email && (
                          <p className="text-xs font-medium text-red-600">{errors.email}</p>
                        )}
                      </div>

                      {/* Password */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-900">
                          Password
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-slate-800 focus:ring-1 focus:ring-slate-800 hover:border-slate-400"
                        />
                        {errors.password && (
                          <p className="text-xs font-medium text-red-600">{errors.password}</p>
                        )}
                      </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full h-10 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Log In"
                    )}
                  </button>

                  <p className="text-center text-sm text-slate-600">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="font-semibold text-slate-900 hover:underline">
                      Sign up
                    </Link>
                  </p>
                </form>
            </Card>
        </div>
      </div>
    </div>
>>>>>>> ac6133de4ade2dd45bad8a9bcaf4a9e19f4f3b81
  );
}



