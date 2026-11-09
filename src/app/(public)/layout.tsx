import { MotionProvider } from "@/components/public/Motion";
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MotionProvider>
      <div className="overflow-x-clip">{children}</div>
    </MotionProvider>
  );
}
