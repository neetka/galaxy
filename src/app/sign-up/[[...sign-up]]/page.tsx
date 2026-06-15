import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
      <div className="animate-fade-in">
        <SignUp
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
