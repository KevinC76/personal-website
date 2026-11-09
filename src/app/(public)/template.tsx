export default function PublicTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="paper-enter">{children}</div>;
}
