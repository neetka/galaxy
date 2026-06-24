import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fb]">
      <div className="animate-fade-in">
        <SignUp
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
