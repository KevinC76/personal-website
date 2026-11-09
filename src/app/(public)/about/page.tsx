import Portfolio from "@/components/public/Portfolio";
import { getPublished } from "@/lib/content/public";
import { pageMetadata, structuredData } from "@/lib/content/metadata";
export const generateMetadata = () => pageMetadata("about");
export default async function Page() {
  const { document } = await getPublished();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData(document, "about") }}
      />
      <Portfolio content={document} page="about" />
    </>
  );
}
