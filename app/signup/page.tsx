"use client";

import React, { Suspense } from "react";
import { AuthPage } from "@/components/auth/AuthPage";

export default function SignupPage() {
<<<<<<< HEAD
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-100">Loading...</div>}>
      <AuthPage initialMode="register" />
    </Suspense>
=======
  const { showToast } = useToast();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Mentor");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    role?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
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
    if (!fullName) nextErrors.fullName = "Full name is required.";
    if (!email) nextErrors.email = "Email is required.";
    if (!role) nextErrors.role = "Role is required.";
    if (!password) nextErrors.password = "Password is required.";
    if (password.length < 8) nextErrors.password = "Password must be at least 8 characters.";
    if (!confirmPassword) nextErrors.confirmPassword = "Confirm your password.";
    if (password && confirmPassword && password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);

    try {
      // Call the signup API
      // Convert "Institution Admin" to "Institution Admin" role (keep capitalization)
      const userRole = role; // Keep original role as selected

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: fullName,
          email,
          password,
          role: userRole,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setApiError(error.error || "Signup failed. Please try again.");
        return;
      }

      const data = await response.json();

      // Store tokens and user info
      localStorage.setItem("shikshanetra_token", data.accessToken);
      localStorage.setItem("shikshanetra_user", JSON.stringify(data.user));
      localStorage.setItem("shikshanetra_logged_in", "true");

      showToast("Account created successfully!");
      
      // Redirect based on role
      if (data.user.role === "Institution Admin") {
        router.push(`/institution/dashboard`);
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Signup error:", error);
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
                  Create your account
               </h1>
               <p className="text-base text-slate-500">
                  Get started with ShikshaNetra today
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
                      {/* Name */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-900">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Aditi Sharma"
                          className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition-all focus:border-slate-800 focus:ring-1 focus:ring-slate-800 hover:border-slate-400"
                        />
                        {errors.fullName && (
                          <p className="text-xs font-medium text-red-600">{errors.fullName}</p>
                        )}
                      </div>

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

                      {/* Role */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-900">
                          Role
                        </label>
                        <div className="relative">
                            <select
                              value={role}
                              onChange={(e) => setRole(e.target.value)}
                              className="w-full h-10 appearance-none rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-slate-800 focus:ring-1 focus:ring-slate-800 hover:border-slate-400"
                            >
                              <option>Mentor</option>
                              <option>Institution Admin</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                               <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                            </div>
                        </div>
                        {errors.role && (
                          <p className="text-xs font-medium text-red-600">{errors.role}</p>
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
                         <p className="text-xs text-slate-500">Must be at least 8 characters</p>
                        {errors.password && (
                          <p className="text-xs font-medium text-red-600">{errors.password}</p>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-900">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-slate-800 focus:ring-1 focus:ring-slate-800 hover:border-slate-400"
                        />
                        {errors.confirmPassword && (
                          <p className="text-xs font-medium text-red-600">
                            {errors.confirmPassword}
                          </p>
                        )}
                      </div>
                  </div>

                  <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="group w-full flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {isLoading ? (
                           <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                           <>
                             Create Account <ArrowRight className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                           </>
                        )}
                      </button>
                  </div>
                </form>
            </Card>

            <p className="text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-slate-900 hover:underline hover:text-primary-600 transition-colors">
                Log in
              </Link>
            </p>
        </div>
        
      </div>
    </div>
>>>>>>> ac6133de4ade2dd45bad8a9bcaf4a9e19f4f3b81
  );
}
