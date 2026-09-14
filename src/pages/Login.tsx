import { useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useApp } from "@/lib/app-state";
import { roleForEmail } from "@/lib/auth-accounts";
import { ActionButton } from "@/components/dls/ActionButton";
import { TextField } from "@/components/dls/TextField";
import logo from "@/assets/figma-setup/logo.svg";
import logoMobile from "@/assets/figma-setup/logo-mobile.svg";

type FieldError = { email?: string; password?: string };

function MicrosoftMark() {
  return (
    <svg
      viewBox="0 0 21 21"
      width="16"
      height="16"
      aria-hidden
      className="shrink-0"
    >
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

export function LoginPage() {
  const { signedIn, signIn } = useApp();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from &&
    (location.state as { from?: string }).from !== "/login"
      ? (location.state as { from: string }).from
      : "/home";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotHint, setForgotHint] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});

  if (signedIn) {
    return <Navigate to={from} replace />;
  }

  function validate(): FieldError {
    const next: FieldError = {};
    const trimmed = email.trim();
    if (!trimmed) next.email = "This field is required.";
    else if (!trimmed.includes("@")) next.email = "Please enter a valid value.";
    else if (!roleForEmail(trimmed)) {
      next.email = "This email is not on Tempo. Contact your Project Officer.";
    }
    if (!password) next.password = "This field is required.";
    return next;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (next.email || next.password) return;
    const role = roleForEmail(email);
    if (!role) return;
    signIn(role);
  }

  return (
    <div className="flex min-h-full flex-col bg-grey-50">
      <div className="dls-page flex flex-1 items-center">
        <div className="dls-grid-12 w-full">
          <div className="mx-auto w-full max-w-[400px] desktop:col-span-4 desktop:col-start-5 desktop:max-w-none">
            <div className="rounded-[var(--radius-2xl)] bg-white px-6 py-8 shadow-[var(--shadow-light-bg)] tablet:px-8 tablet:py-10">
              <img
                src={logoMobile}
                alt="CHANGI airport group"
                className="mb-8 block h-7 w-auto object-contain tablet:hidden"
              />
              <img
                src={logo}
                alt="CHANGI airport group"
                className="mb-8 hidden h-[35px] w-[130px] object-contain tablet:block"
              />

              <h1 className="text-2xl leading-[30px] font-black text-black">
                Sign in
              </h1>
              <p className="mt-2 text-sm leading-[18px] text-grey-500 desktop:text-base desktop:leading-5">
                Access your unit works in Tempo.
              </p>

              <form className="mt-8 flex flex-col gap-6" onSubmit={handleSubmit}>
                <TextField
                  id="login-email"
                  name="email"
                  type="email"
                  label="Work email"
                  autoComplete="username"
                  inputMode="email"
                  placeholder="name@company.com"
                  value={email}
                  error={errors.email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                />

                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm leading-[18px] font-bold text-black">
                      Password
                    </span>
                    <button
                      type="button"
                      onClick={() => setForgotHint(true)}
                      className="text-sm leading-[18px] text-purple-600 hover:text-purple-700"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <TextField
                    id="login-password"
                    name="password"
                    label="Password"
                    hideLabel
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter password"
                    value={password}
                    error={errors.password}
                    hint={forgotHint ? "Ask your Project Officer." : undefined}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) {
                        setErrors((prev) => ({
                          ...prev,
                          password: undefined,
                        }));
                      }
                    }}
                    trailing={
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="grid size-8 place-items-center rounded-[var(--radius-sm)] text-grey-500 hover:bg-grey-50 hover:text-grey-700"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    }
                  />
                </div>

                <ActionButton type="submit" variant="primary" size="lg">
                  Sign In
                </ActionButton>
              </form>

              <div className="mt-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-grey-100" />
                <span className="text-sm leading-[18px] text-grey-400">or</span>
                <span className="h-px flex-1 bg-grey-100" />
              </div>

              <ActionButton
                type="button"
                variant="secondary"
                size="lg"
                className="mt-6 w-full"
                onClick={() => signIn("officer")}
              >
                <MicrosoftMark />
                Sign In with Microsoft
              </ActionButton>

              <p className="mt-8 text-sm leading-[18px] text-grey-500">
                Need access? Contact your Project Officer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
