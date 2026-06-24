import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fb]">
      <div className="animate-fade-in">
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-white border-gray-200 shadow-lg",
            },
          }}
        />
      </div>
    </div>
  );
}
