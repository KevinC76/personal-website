import Portfolio from "@/components/public/Portfolio";
import { getPublished } from "@/lib/content/public";
import { pageMetadata, structuredData } from "@/lib/content/metadata";
export const generateMetadata = () => pageMetadata("home");
export default async function Page() {
  const { document, revision } = await getPublished();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData(document, "home") }}
      />
      <Portfolio revision={revision} content={document} page="home" />
    </>
  );
}
