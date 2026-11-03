import { useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useApp } from "@/lib/app-state";
import { roleForEmail } from "@/lib/auth-accounts";
import { ActionButton } from "@/components/dls/ActionButton";
import { TextField } from "@/components/dls/TextField";
import logo from "@/assets/figma-setup/logo.svg";
import { CUT_STANDALONE, V31_HOME_HREF } from "@/lib/process-v31-preview";

type FieldError = { email?: string; password?: string };

export function LoginPage() {
  const { signedIn, signIn } = useApp();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from &&
    (location.state as { from?: string }).from !== "/login"
      ? (location.state as { from: string }).from
      : CUT_STANDALONE
        ? V31_HOME_HREF
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
    else if (!trimmed.includes("@")) {
      next.email = "Please ensure your email address is correct";
    } else if (!roleForEmail(trimmed)) {
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
    <div className="flex min-h-full flex-col bg-grey-50 px-4 desktop:px-10">
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-[342px] desktop:max-w-[400px]">
          <div className="rounded-[var(--radius-2xl)] bg-white px-[var(--spacing-24)] py-[var(--spacing-32)] shadow-[var(--shadow-light-bg)] desktop:px-[var(--spacing-32)] desktop:py-[var(--spacing-40)]">
            <img
              src={logo}
              alt="CHANGI airport group"
              className="block h-[35px] w-[130px] object-contain"
            />

            <h1 className="mt-[var(--spacing-32)]">Sign in</h1>

            <form
              className="mt-[var(--spacing-24)]"
              onSubmit={handleSubmit}
            >
              <div className="flex flex-col gap-[var(--spacing-24)]">
                <TextField
                  id="login-email"
                  name="email"
                  type="email"
                  label="Email"
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

                <TextField
                  id="login-password"
                  name="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter password"
                  value={password}
                  error={errors.password}
                  hint={forgotHint ? "Ask your Project Officer." : undefined}
                  optional={
                    <button
                      type="button"
                      onClick={() => setForgotHint(true)}
                      className="text-sm leading-[18px] text-purple-600 hover:text-purple-700"
                    >
                      Forgot password?
                    </button>
                  }
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

              <ActionButton
                type="submit"
                variant="primary"
                size="lg"
                className="mt-[var(--spacing-48)] h-11 w-full min-w-0"
              >
                Sign In
              </ActionButton>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
