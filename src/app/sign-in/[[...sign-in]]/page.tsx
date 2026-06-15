import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
      <div className="animate-fade-in">
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-[#1a1a2e] border-zinc-800",
            },
          }}
        />
      </div>
    </div>
  );
}
