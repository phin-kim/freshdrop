import { useState, FormEvent } from 'react';
import { z } from 'zod';
import { useStore } from '../Store/productStore';

const signUpSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const signInSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export default function LoginView() {
  const { signIn, signUp, loading, addToast } = useStore();
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authErrors, setAuthErrors] = useState<{ [key: string]: string }>({});

  const handleAutoFillDemo = () => {
    setEmail("demo@freshdrop.com");
    setPassword("123456");
    setName("Phinehas Njuguna");
    setAuthErrors({});
    addToast("Demo credentials loaded! Click login.", "info");
  };

  const handleSignUp = (e: FormEvent) => {
    e.preventDefault();
    setAuthErrors({});
    const result = signUpSchema.safeParse({ name, email, password });
    if (!result.success) {
      const fieldErrors: { [key: string]: string } = {};
      result.error.issues.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setAuthErrors(fieldErrors);
      addToast("Invalid sign up form details provided.", "error");
      return;
    }
    signUp(email, name);
  };

  const handleSignIn = (e: FormEvent) => {
    e.preventDefault();
    setAuthErrors({});
    const result = signInSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { [key: string]: string } = {};
      result.error.issues.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setAuthErrors(fieldErrors);
      addToast("Invalid sign in details.", "error");
      return;
    }
    signIn(email, name || "Valued Customer");
  };

  return (
    <main className="flex-grow flex items-center justify-center px-4 py-8 md:p-12">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden border border-outline-variant/30">
        
        {/* Visual Screen on Left */}
        <div className="hidden lg:flex flex-col items-center justify-center bg-secondary-container p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, #006e1c 1px, transparent 0)", backgroundSize: "24px 24px" }}></div>
          <div className="relative z-10 class-illustration-float">
            <img
              alt="FreshDrop Shopping Illustration"
              className="w-full h-auto max-w-xs mx-auto mb-8 rounded-lg shadow-sm"
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600"
            />
          </div>
          <h2 className="font-caveat text-5xl font-bold text-primary mb-4 leading-tight">Fresh from Local Farms</h2>
          <p className="font-inter text-sm text-on-secondary-container max-w-xs mx-auto leading-relaxed">
            Bringing the local farmers market directly to your doorstep with certified organic assurance and custom smart baskets.
          </p>
        </div>

        {/* Auth Form and Form Inputs on Right */}
        <div className="p-8 lg:p-12 flex flex-col justify-center bg-white">
          {/* Dynamic Header */}
          <div className="mb-8 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-2 text-primary">
              <span className="material-symbols-outlined text-4xl font-bold">eco</span>
              <span className="font-caveat text-4xl font-bold text-primary">FreshDrop</span>
            </div>
            <h1 className="font-caveat text-[34px] font-bold text-on-surface mb-2">
              {authMode === "login" ? "Welcome Back!" : "Fresh Pantry Registration"}
            </h1>
            <p className="text-sm text-outline">
              {authMode === "login" ? "Enter your email credentials to access your local basket." : "Sign up and explore beautiful farm-fresh deals!"}
            </p>
          </div>

          {/* Form implementation */}
          <form onSubmit={authMode === "login" ? handleSignIn : handleSignUp} className="space-y-5">
            {authMode === "signup" && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block" htmlFor="name">Full Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">person</span>
                  <input
                    id="name"
                    type="text"
                    placeholder="e.g. Phinehas Njuguna"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (authErrors.name) setAuthErrors(prev => { const c = { ...prev }; delete c.name; return c; });
                    }}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-surface-container-low focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-[15px] ${authErrors.name ? "border-error focus:ring-error" : "border-outline-variant"}`}
                  />
                </div>
                {authErrors.name && (
                  <p className="text-xs text-error font-medium">{authErrors.name}</p>
                )}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block" htmlFor="email">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">mail</span>
                <input
                  id="email"
                  type="email"
                  placeholder="hello@freshdrop.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (authErrors.email) setAuthErrors(prev => { const c = { ...prev }; delete c.email; return c; });
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-surface-container-low focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-[15px] ${authErrors.email ? "border-error focus:ring-error" : "border-outline-variant"}`}
                />
              </div>
              {authErrors.email && (
                <p className="text-xs text-error font-medium">{authErrors.email}</p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block" htmlFor="password">Password</label>
                {authMode === "login" && (
                  <button type="button" className="text-xs text-primary font-bold hover:underline" onClick={() => addToast("Password reset link sent to simulating backend.", "info")}>
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">lock</span>
                <input
                  id="password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (authErrors.password) setAuthErrors(prev => { const c = { ...prev }; delete c.password; return c; });
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-surface-container-low focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-[15px] ${authErrors.password ? "border-error focus:ring-error" : "border-outline-variant"}`}
                />
              </div>
              {authErrors.password && (
                <p className="text-xs text-error font-medium">{authErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-container disabled:bg-primary/50 text-white font-bold py-3.5 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 active:scale-95 duration-150 text-[15px] flex justify-center items-center gap-2 mt-4"
            >
              {loading && <span className="animate-spin text-lg material-symbols-outlined">sync</span>}
              {authMode === "login" ? "Login to Pantry" : "Register with FreshDrop"}
            </button>

            {/* Divider panel */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-outline-variant/50"></div>
              <span className="mx-3 text-[10px] font-bold tracking-widest text-outline uppercase">OR Use Sandbox</span>
              <div className="flex-grow border-t border-outline-variant/50"></div>
            </div>

            {/* Sandbox credentials autofill helper */}
            <button
              type="button"
              onClick={handleAutoFillDemo}
              className="w-full border border-primary text-primary hover:bg-emerald-50/50 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 text-xs"
            >
              <span className="material-symbols-outlined text-base">vpn_key</span>
              Auto-fill demo instructions
            </button>
          </form>

          {/* Toggle Login <-> Signup */}
          <div className="mt-8 text-center text-sm">
            <p className="text-on-surface-variant font-medium">
              {authMode === "login" ? "Don't have an account yet?" : "Already registered?"}
              <button
                onClick={() => {
                  setAuthMode(authMode === "login" ? "signup" : "login");
                  setAuthErrors({});
                }}
                className="text-primary font-bold hover:underline ml-1"
              >
                {authMode === "login" ? "Sign Up Free" : "Login Here"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
