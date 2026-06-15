export default function WorkflowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#09090b]">
      {children}
    </div>
  );
}
