"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User as UserIcon,
  BookOpen,
  ShieldCheck,
  CircleUser,
  Camera,
  Trash2,
  Eye,
  EyeOff,
  Check,
  Loader2,
  ChevronLeft,
  LogOut,
  Building2,
} from "lucide-react";
import { Card } from "@/components/Card";
import { UserAvatar } from "@/components/UserAvatar";
import { useToast } from "@/components/ToastContext";
import { fetchWithAuth, getWithAuth, postWithAuth } from "@/lib/utils/api";
import { validatePassword } from "@/lib/validators/auth";
import { SUBJECTS, LANGUAGES } from "@/lib/constants/teaching";

interface SettingsUser {
  id: string;
  email: string;
  name: string;
  role: string;
  institutionId?: string;
  image: string;
  bio: string;
  phone: string;
  location: string;
  organization: string;
  preferences: { defaultSubject: string; defaultLanguage: string };
  hasPassword: boolean;
  hasGoogle: boolean;
  createdAt?: string;
}

const SECTIONS = [
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "institution", label: "Institution", icon: Building2 },
  { id: "teaching", label: "Teaching preferences", icon: BookOpen },
  { id: "security", label: "Password & security", icon: ShieldCheck },
  { id: "account", label: "Account", icon: CircleUser },
] as const;

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const inputClass =
  "w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-500";

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function SectionCard({ id, title, description, children }: { id: string; title: string; description: string; children: ReactNode }) {
  return (
    <Card className="scroll-mt-24 border-slate-200 p-0 overflow-hidden">
      <section id={id} aria-labelledby={`${id}-title`}>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 id={`${id}-title`} className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        </div>
        <div className="px-6 py-5">{children}</div>
      </section>
    </Card>
  );
}

function SaveButton({ saving, disabled, children = "Save changes" }: { saving: boolean; disabled?: boolean; children?: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={saving || disabled}
      className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

/** Square, face-centred, compressed variant of a Cloudinary upload for use as an avatar. */
function avatarUrl(secureUrl: string) {
  return secureUrl.replace("/image/upload/", "/image/upload/c_fill,g_face,w_256,h_256,q_auto,f_auto/");
}

export default function SettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<SettingsUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [profile, setProfile] = useState({ name: "", phone: "", location: "", organization: "", bio: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Teaching preferences
  const [prefs, setPrefs] = useState({ defaultSubject: "", defaultLanguage: "" });
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Password
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const [activeSection, setActiveSection] = useState<string>("profile");

  // Institution (admins only)
  const [institutionName, setInstitutionName] = useState("");
  const [savedInstitutionName, setSavedInstitutionName] = useState("");
  const [savingInstitution, setSavingInstitution] = useState(false);
  const isAdmin = user?.role === "Institution Admin";
  /** Admins manage an institution rather than teach, so they get "institution" instead of "teaching". */
  const sections = SECTIONS.filter((s) => (isAdmin ? s.id !== "teaching" : s.id !== "institution"));

  const applyUser = (fresh: SettingsUser) => {
    setUser(fresh);
    setProfile({
      name: fresh.name || "",
      phone: fresh.phone || "",
      location: fresh.location || "",
      organization: fresh.organization || "",
      bio: fresh.bio || "",
    });
    setPrefs({
      defaultSubject: fresh.preferences?.defaultSubject || "",
      defaultLanguage: fresh.preferences?.defaultLanguage || "",
    });
    // Keep the copy the navbar and upload page read in sync.
    try {
      const stored = JSON.parse(localStorage.getItem("shikshanetra_user") || "{}");
      localStorage.setItem("shikshanetra_user", JSON.stringify({ ...stored, ...fresh }));
    } catch {
      localStorage.setItem("shikshanetra_user", JSON.stringify(fresh));
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("shikshanetra_token");
    const loggedIn = localStorage.getItem("shikshanetra_logged_in") === "true";
    if (!token && !loggedIn) {
      showToast("Please login to manage your settings");
      router.push("/login");
      return;
    }
    (async () => {
      try {
        const res = await getWithAuth("/api/auth/me");
        if (!res.ok) throw new Error("Failed to load settings");
        const me = await res.json();
        applyUser(me);
        if (me.role === "Institution Admin" && me.institutionId) {
          const instRes = await getWithAuth(`/api/institution/${me.institutionId}`);
          if (instRes.ok) {
            const name = (await instRes.json())?.institution?.name || "";
            setInstitutionName(name);
            setSavedInstitutionName(name);
          }
        }
      } catch (error) {
        console.error(error);
        showToast("Could not load your settings");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Highlight the section in view in the side navigation.
  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -55% 0px" }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAdmin]);

  /** PATCH /api/auth/me and apply the result. Returns true on success. */
  const patchMe = async (payload: Record<string, unknown>, successMessage: string) => {
    const res = await fetchWithAuth("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.error || "Could not save your changes");
      return false;
    }
    applyUser(data);
    showToast(successMessage);
    return true;
  };

  const profileDirty =
    !!user &&
    (profile.name.trim() !== user.name ||
      profile.phone.trim() !== user.phone ||
      profile.location.trim() !== user.location ||
      profile.organization.trim() !== user.organization ||
      profile.bio.trim() !== user.bio);

  const prefsDirty =
    !!user &&
    (prefs.defaultSubject !== user.preferences.defaultSubject || prefs.defaultLanguage !== user.preferences.defaultLanguage);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile.name.trim().length < 2) {
      showToast("Name must be at least 2 characters");
      return;
    }
    setSavingProfile(true);
    try {
      await patchMe(profile, "Profile updated");
    } catch {
      showToast("Could not save your profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const institutionDirty = institutionName.trim().replace(/\s+/g, " ") !== savedInstitutionName;

  const handleInstitutionSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = institutionName.trim().replace(/\s+/g, " ");
    if (name.length < 2) {
      showToast("Institution name must be at least 2 characters");
      return;
    }
    if (!user?.institutionId) return;
    setSavingInstitution(true);
    try {
      const res = await fetchWithAuth(`/api/institution/${user.institutionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || "Could not rename your institution");
        return;
      }
      const saved = data.institution?.name || name;
      setInstitutionName(saved);
      setSavedInstitutionName(saved);
      showToast("Institution renamed");
    } catch {
      showToast("Could not rename your institution");
    } finally {
      setSavingInstitution(false);
    }
  };

  const handlePrefsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      await patchMe({ preferences: prefs }, "Teaching preferences saved");
    } catch {
      showToast("Could not save your preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handlePhotoFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Choose an image file (JPG, PNG or WebP)");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      showToast("Photo must be 5 MB or smaller");
      return;
    }
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !preset) {
      showToast("Photo upload is not configured. Paste an image URL instead.");
      return;
    }

    setPhotoBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", preset);
      form.append("folder", "avatars");
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.secure_url) {
        throw new Error(data?.error?.message || "Upload failed");
      }
      await patchMe({ image: avatarUrl(data.secure_url) }, "Profile picture updated");
    } catch (error: any) {
      console.error("Avatar upload failed:", error);
      showToast(`Couldn't upload the photo (${error?.message || "error"}). You can paste an image URL instead.`);
    } finally {
      setPhotoBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePhotoUrlSave = async () => {
    const url = photoUrlInput.trim();
    if (!url) return;
    setPhotoBusy(true);
    try {
      if (await patchMe({ image: url }, "Profile picture updated")) setPhotoUrlInput("");
    } finally {
      setPhotoBusy(false);
    }
  };

  const handlePhotoRemove = async () => {
    setPhotoBusy(true);
    try {
      await patchMe({ image: "" }, "Profile picture removed");
    } finally {
      setPhotoBusy(false);
    }
  };

  const pwMismatch = pw.confirm.length > 0 && pw.next !== pw.confirm;
  const pwWeak = pw.next.length > 0 && !validatePassword(pw.next);
  const pwReady = (!user?.hasPassword || pw.current.length > 0) && validatePassword(pw.next) && pw.next === pw.confirm;

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwReady) return;
    setSavingPw(true);
    try {
      const res = await postWithAuth("/api/auth/password", { currentPassword: pw.current, newPassword: pw.next });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || "Could not update your password");
        return;
      }
      showToast(data.message || "Password updated");
      setPw({ current: "", next: "", confirm: "" });
      setUser((u) => (u ? { ...u, hasPassword: true } : u));
    } catch {
      showToast("Could not update your password");
    } finally {
      setSavingPw(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Clearing local state below logs the user out of this browser regardless.
    }
    localStorage.removeItem("shikshanetra_token");
    localStorage.removeItem("shikshanetra_user");
    localStorage.removeItem("shikshanetra_logged_in");
    document.cookie = "shikshanetra_logged_in=; path=/; max-age=0";
    showToast("Logged out");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading settings…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-slate-700">We couldn&apos;t load your settings.</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-sm font-semibold text-primary-600 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
    : null;
  const subjectOptions = prefs.defaultSubject && !SUBJECTS.includes(prefs.defaultSubject) ? [prefs.defaultSubject, ...SUBJECTS] : SUBJECTS;

  return (
    <div className="min-h-screen bg-slate-50/30 pb-20">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link href="/profile" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800">
          <ChevronLeft className="h-4 w-4" /> Back to profile
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isAdmin ? "Manage your profile, institution and sign-in." : "Manage your profile, teaching defaults and sign-in."}
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* Section navigation: a sticky list on desktop, scrollable chips on small screens */}
          <nav aria-label="Settings sections" className="lg:sticky lg:top-24 lg:self-start">
            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
              {sections.map(({ id, label, icon: Icon }) => (
                <li key={id} className="shrink-0">
                  <a
                    href={`#${id}`}
                    aria-current={activeSection === id ? "true" : undefined}
                    className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                      activeSection === id
                        ? "bg-primary-50 text-primary-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 space-y-6">
            {/* ---------------- Profile ---------------- */}
            <SectionCard id="profile" title="Profile" description="How you appear across ShikshaNetra and to your institution.">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                <UserAvatar
                  image={user.image}
                  name={user.name}
                  className="h-20 w-20 bg-slate-200 text-2xl font-bold text-slate-500 ring-4 ring-slate-50"
                />
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      id="photo-input"
                      onChange={(e) => e.target.files?.[0] && handlePhotoFile(e.target.files[0])}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photoBusy}
                      className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                    >
                      {photoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      {user.image ? "Change photo" : "Upload photo"}
                    </button>
                    {user.image && (
                      <button
                        type="button"
                        onClick={handlePhotoRemove}
                        disabled={photoBusy}
                        className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" /> Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">JPG, PNG or WebP, up to 5 MB. Cropped to a square around your face.</p>
                  <div className="flex max-w-md gap-2">
                    <label htmlFor="photo-url" className="sr-only">Image URL</label>
                    <input
                      id="photo-url"
                      type="url"
                      placeholder="…or paste an image URL (https://)"
                      value={photoUrlInput}
                      onChange={(e) => setPhotoUrlInput(e.target.value)}
                      className={`${inputClass} h-9`}
                    />
                    <button
                      type="button"
                      onClick={handlePhotoUrlSave}
                      disabled={photoBusy || !photoUrlInput.trim()}
                      className="shrink-0 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Use URL
                    </button>
                  </div>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Full name" htmlFor="name">
                    <input
                      id="name"
                      className={inputClass}
                      value={profile.name}
                      maxLength={80}
                      required
                      autoComplete="name"
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </Field>
                  <Field label="Email" htmlFor="email" hint="Your email is your login and can't be changed here.">
                    <input id="email" className={inputClass} value={user.email} disabled />
                  </Field>
                  <Field label="Phone" htmlFor="phone">
                    <input
                      id="phone"
                      type="tel"
                      className={inputClass}
                      value={profile.phone}
                      maxLength={20}
                      autoComplete="tel"
                      placeholder="+91 98765 43210"
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </Field>
                  <Field label="Location" htmlFor="location">
                    <input
                      id="location"
                      className={inputClass}
                      value={profile.location}
                      maxLength={80}
                      placeholder="City, State"
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="School / organization" htmlFor="organization">
                      <input
                        id="organization"
                        className={inputClass}
                        value={profile.organization}
                        maxLength={120}
                        autoComplete="organization"
                        placeholder="Where you teach"
                        onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                      />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Bio" htmlFor="bio" hint={`${profile.bio.length}/300 · A short line about what and how you teach.`}>
                      <textarea
                        id="bio"
                        rows={3}
                        maxLength={300}
                        className={`${inputClass} h-auto py-2 leading-relaxed`}
                        value={profile.bio}
                        placeholder="e.g. Physics teacher for classes 9–12, focused on experiments and real-world examples."
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      />
                    </Field>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  {profileDirty && (
                    <button
                      type="button"
                      onClick={() => applyUser(user)}
                      className="text-sm font-medium text-slate-500 hover:text-slate-800"
                    >
                      Discard
                    </button>
                  )}
                  <SaveButton saving={savingProfile} disabled={!profileDirty} />
                </div>
              </form>
            </SectionCard>

            {/* ---------------- Institution (admins) ---------------- */}
            {isAdmin && (
              <SectionCard
                id="institution"
                title="Institution"
                description="The name your teachers see and that heads your institution dashboard."
              >
                <form onSubmit={handleInstitutionSave} className="space-y-5">
                  <Field label="Institution name" htmlFor="institution-name" hint="2–120 characters.">
                    <input
                      id="institution-name"
                      className={inputClass}
                      value={institutionName}
                      maxLength={120}
                      autoComplete="organization"
                      placeholder="e.g. Sunrise Public School"
                      onChange={(e) => setInstitutionName(e.target.value)}
                    />
                  </Field>
                  <div className="flex items-center justify-end gap-3">
                    {institutionDirty && (
                      <button
                        type="button"
                        onClick={() => setInstitutionName(savedInstitutionName)}
                        className="text-sm font-medium text-slate-500 hover:text-slate-800"
                      >
                        Discard
                      </button>
                    )}
                    <SaveButton saving={savingInstitution} disabled={!institutionDirty} />
                  </div>
                </form>
              </SectionCard>
            )}

            {/* ---------------- Teaching preferences ---------------- */}
            {!isAdmin && (
            <SectionCard
              id="teaching"
              title="Teaching preferences"
              description="Defaults filled in for you each time you upload a new session."
            >
              <form onSubmit={handlePrefsSave} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Default subject" htmlFor="default-subject" hint="Also used as the topic the model compares your lesson against.">
                    <select
                      id="default-subject"
                      className={inputClass}
                      value={prefs.defaultSubject}
                      onChange={(e) => setPrefs({ ...prefs, defaultSubject: e.target.value })}
                    >
                      <option value="">No default</option>
                      {subjectOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Default lesson language" htmlFor="default-language">
                    <select
                      id="default-language"
                      className={inputClass}
                      value={prefs.defaultLanguage}
                      onChange={(e) => setPrefs({ ...prefs, defaultLanguage: e.target.value })}
                    >
                      <option value="">No default</option>
                      {LANGUAGES.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="flex justify-end border-t border-slate-100 pt-4">
                  <SaveButton saving={savingPrefs} disabled={!prefsDirty} />
                </div>
              </form>
            </SectionCard>
            )}

            {/* ---------------- Security ---------------- */}
            <SectionCard
              id="security"
              title="Password & security"
              description={
                user.hasPassword
                  ? "Change the password you use to log in with your email."
                  : "You sign in with Google. Set a password to also log in with your email."
              }
            >
              <form onSubmit={handlePasswordSave} className="max-w-md space-y-4">
                {/* Lets password managers associate the new password with this account */}
                <input type="text" name="username" autoComplete="username" value={user.email} readOnly hidden />
                {user.hasPassword && (
                  <Field label="Current password" htmlFor="current-password">
                    <input
                      id="current-password"
                      type={showPw ? "text" : "password"}
                      className={inputClass}
                      value={pw.current}
                      autoComplete="current-password"
                      onChange={(e) => setPw({ ...pw, current: e.target.value })}
                    />
                  </Field>
                )}
                <Field
                  label="New password"
                  htmlFor="new-password"
                  hint={
                    <span className={pwWeak ? "text-rose-600" : undefined}>
                      At least 8 characters, with an uppercase letter, a lowercase letter and a number.
                    </span>
                  }
                >
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPw ? "text" : "password"}
                      className={`${inputClass} pr-10`}
                      value={pw.next}
                      autoComplete="new-password"
                      aria-invalid={pwWeak || undefined}
                      onChange={(e) => setPw({ ...pw, next: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-700"
                      aria-label={showPw ? "Hide passwords" : "Show passwords"}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
                <Field
                  label="Confirm new password"
                  htmlFor="confirm-password"
                  hint={pwMismatch ? <span className="text-rose-600">Passwords don&apos;t match.</span> : undefined}
                >
                  <input
                    id="confirm-password"
                    type={showPw ? "text" : "password"}
                    className={inputClass}
                    value={pw.confirm}
                    autoComplete="new-password"
                    aria-invalid={pwMismatch || undefined}
                    onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                  />
                </Field>
                <div className="flex justify-end pt-2">
                  <SaveButton saving={savingPw} disabled={!pwReady}>
                    {user.hasPassword ? "Change password" : "Set password"}
                  </SaveButton>
                </div>
              </form>
            </SectionCard>

            {/* ---------------- Account ---------------- */}
            <SectionCard id="account" title="Account" description="Details managed by ShikshaNetra or your institution.">
              <dl className="divide-y divide-slate-100 text-sm">
                <div className="flex flex-wrap justify-between gap-2 py-3 first:pt-0">
                  <dt className="text-slate-500">Role</dt>
                  <dd className="font-medium text-slate-900">{user.role}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2 py-3">
                  <dt className="text-slate-500">Institution</dt>
                  <dd className="font-medium text-slate-900">
                    {user.institutionId ? (
                      "Member of an institution"
                    ) : (
                      <span className="text-slate-500">Not linked · <Link href="/profile" className="text-primary-600 hover:underline">join from your profile</Link></span>
                    )}
                  </dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2 py-3">
                  <dt className="text-slate-500">Sign-in methods</dt>
                  <dd className="flex flex-wrap gap-2">
                    {user.hasPassword && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        <Check className="h-3 w-3" /> Email & password
                      </span>
                    )}
                    {user.hasGoogle && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        <Check className="h-3 w-3" /> Google
                      </span>
                    )}
                  </dd>
                </div>
                {memberSince && (
                  <div className="flex flex-wrap justify-between gap-2 py-3">
                    <dt className="text-slate-500">Member since</dt>
                    <dd className="font-medium text-slate-900">{memberSince}</dd>
                  </div>
                )}
              </dl>
              <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}
