import { useState } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const isRegister = location.pathname === "/register";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (isRegister && !name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setSubmitting(true);

      if (isRegister) {
        await register(name.trim(), email.trim(), password);

        await login(email.trim(), password);
      } else {
        await login(email.trim(), password);
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Something went wrong. Please try again.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left panel */}
        <div className="hidden bg-zinc-950 px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="text-xl font-semibold tracking-tight">
              SynapseOS
            </div>

            <div className="mt-20 max-w-lg">
              <p className="text-sm font-medium text-zinc-400">
                Intelligent workspace
              </p>

              <h1 className="mt-4 text-5xl font-semibold leading-tight tracking-tight">
                One workspace for your
                <span className="text-zinc-400">
                  {" "}
                  project work.
                </span>
              </h1>

              <p className="mt-6 max-w-md text-sm leading-6 text-zinc-400">
                Manage projects, tasks, sprints, documentation,
                meetings, development activity and project intelligence
                in one place.
              </p>
            </div>
          </div>

          <p className="text-xs text-zinc-500">
            SynapseOS · Project collaboration workspace
          </p>
        </div>

        {/* Right panel */}
        <div className="flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            {/* Mobile brand */}
            <div className="mb-12 lg:hidden">
              <h1 className="text-xl font-semibold tracking-tight text-zinc-950">
                SynapseOS
              </h1>

              <p className="mt-1 text-xs text-zinc-400">
                Intelligent workspace
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-zinc-400">
                {isRegister ? "Get started" : "Welcome back"}
              </p>

              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
                {isRegister
                  ? "Create your account"
                  : "Sign in to SynapseOS"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                {isRegister
                  ? "Create your workspace account to start collaborating."
                  : "Manage your projects and continue where you left off."}
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              {isRegister && (
                <div>
                  <label className="text-sm font-medium text-zinc-800">
                    Name
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Shivangee Pandey"
                    className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-zinc-800">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-800">
                  Password
                </label>

                <div className="relative mt-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-3 pr-11 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-zinc-200 bg-zinc-100 px-3.5 py-3 text-sm text-zinc-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                    Please wait...
                  </>
                ) : (
                  <>
                    {isRegister ? "Create account" : "Sign in"}
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 text-center text-sm text-zinc-500">
              {isRegister
                ? "Already have an account?"
                : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() =>
                  navigate(
                    isRegister ? "/login" : "/register"
                  )
                }
                className="font-medium text-zinc-900 hover:underline"
              >
                {isRegister ? "Sign in" : "Create account"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;