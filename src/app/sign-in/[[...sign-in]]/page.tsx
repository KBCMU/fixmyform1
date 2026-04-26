import { SignInPanel } from "./SignInPanel";

export default function SignInPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{ background: "var(--bg-primary)" }}
    >
      <SignInPanel />
    </div>
  );
}
