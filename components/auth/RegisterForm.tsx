"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Mail,
  Lock,
  User,
  Briefcase,
  Building2,
  Phone,
  MapPin,
  ImageIcon,
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/components/ToastContext";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { cn } from "@/lib/utils/cn";
import { homeForRole } from "@/lib/utils/roles";

const inputClass =
  "block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all disabled:opacity-50 bg-white/50";

const PHONE_RE = /^[+\d][\d\s()-]{6,19}$/;
const URL_RE = /^https?:\/\/\S+$/i;

function IconInput({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        {icon}
      </div>
      {children}
    </div>
  );
}

interface RegisterFormProps {
  className?: string;
}

export function RegisterForm({ className }: RegisterFormProps) {
  const { showToast } = useToast();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Mentor");
  const [password, setPassword] = useState("");
  const [institutionName, setInstitutionName] = useState("");

  // Optional profile details (stored on the user document if provided)
  const [showOptional, setShowOptional] = useState(false);
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [organization, setOrganization] = useState("");
  const [image, setImage] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string>("");

  const isAdmin = role === "Institution Admin";
  const avatarPreview = URL_RE.test(image.trim()) ? image.trim() : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    if (!fullName || !email || !password) {
      setApiError("Please fill in all required fields");
      return;
    }
    if (password.length < 8) {
      setApiError("Password must be at least 8 characters");
      return;
    }
    if (phone.trim() && !PHONE_RE.test(phone.trim())) {
      setApiError("Phone number looks invalid");
      setShowOptional(true);
      return;
    }
    if (image.trim() && !avatarPreview) {
      setApiError("Avatar must be a valid http(s) image URL");
      setShowOptional(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email,
          role,
          password,
          // Optional — blank values are ignored by the server
          phone,
          location,
          image,
          organization: isAdmin ? "" : organization,
          institutionName: isAdmin ? institutionName : "",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setApiError(error.error || "Signup failed");
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      localStorage.setItem("shikshanetra_token", data.accessToken);
      localStorage.setItem("shikshanetra_user", JSON.stringify(data.user));
      localStorage.setItem("shikshanetra_logged_in", "true");

      showToast("Account created successfully!");
      router.push(homeForRole(data.user?.role));
    } catch (error) {
      console.error("Signup error", error);
      setApiError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("w-full max-w-sm space-y-5 px-8 py-10", className)}>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Create Account</h1>
        <p className="mt-2 text-sm text-slate-600">Join ShikshaNetra today</p>
      </div>

      <GoogleAuthButton mode="signup" />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-500">Or register with</span>
        </div>
      </div>

      {apiError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">{apiError}</div>
      )}

      <div className="space-y-4">
        <IconInput icon={<User className="h-4 w-4" />}>
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading}
            autoComplete="name"
            className={inputClass}
          />
        </IconInput>
        <IconInput icon={<Mail className="h-4 w-4" />}>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            autoComplete="email"
            className={inputClass}
          />
        </IconInput>
        <IconInput icon={<Briefcase className="h-4 w-4" />}>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={isLoading}
            aria-label="Role"
            className={cn(inputClass, "text-slate-700 appearance-none")}
          >
            <option value="Mentor">Mentor / Teacher</option>
            <option value="Coordinator">Coordinator</option>
            <option value="Institution Admin">Institution Admin</option>
          </select>
        </IconInput>
        {isAdmin && (
          <IconInput icon={<Building2 className="h-4 w-4" />}>
            <input
              type="text"
              placeholder="Institution name (optional)"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              disabled={isLoading}
              maxLength={120}
              autoComplete="organization"
              className={inputClass}
            />
          </IconInput>
        )}
        <IconInput icon={<Lock className="h-4 w-4" />}>
          <input
            type="password"
            placeholder="Password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            autoComplete="new-password"
            className={inputClass}
          />
        </IconInput>
      </div>

      <div className="rounded-lg border border-slate-200">
        <button
          type="button"
          onClick={() => setShowOptional((v) => !v)}
          aria-expanded={showOptional}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <span>
            Profile details <span className="font-normal text-slate-400">(optional)</span>
          </span>
          <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", showOptional && "rotate-180")} />
        </button>

        {showOptional && (
          <div className="space-y-3 border-t border-slate-100 p-3">
            <IconInput icon={<Phone className="h-4 w-4" />}>
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
                autoComplete="tel"
                className={inputClass}
              />
            </IconInput>
            <IconInput icon={<MapPin className="h-4 w-4" />}>
              <input
                type="text"
                placeholder="City / location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isLoading}
                maxLength={120}
                className={inputClass}
              />
            </IconInput>
            {!isAdmin && (
              <IconInput icon={<Building2 className="h-4 w-4" />}>
                <input
                  type="text"
                  placeholder="School / organization"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  disabled={isLoading}
                  maxLength={120}
                  autoComplete="organization"
                  className={inputClass}
                />
              </IconInput>
            )}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <IconInput icon={<ImageIcon className="h-4 w-4" />}>
                  <input
                    type="url"
                    placeholder="Avatar image URL"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    disabled={isLoading}
                    className={inputClass}
                  />
                </IconInput>
              </div>
              {avatarPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover"
                />
              )}
            </div>
            <p className="text-xs text-slate-500">You can add or change these any time from Settings.</p>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-slate-800 hover:translate-y-[-1px] active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
      </button>
    </form>
  );
}
