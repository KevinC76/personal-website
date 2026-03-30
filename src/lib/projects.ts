export interface Project {
  id: string;
  label: string;
  title: string;
  year: string;
  tags: string[];
  summary: string;
  body: string[];
  quote: string;
  quoteAttribution: string;
  outcome: string;
  image: string;
  imageAlt: string;
  imageLeft: boolean;
}

export const projects: Project[] = [
  {
    id: "01",
    label: "Case Study 01",
    title: "The Portfolio Gazette — Personal Website",
    year: "2025",
    tags: ["Next.js", "Tailwind CSS", "Framer Motion", "UI/UX Design"],
    summary:
      "A personal portfolio built as a living editorial artifact — designed around the authoritative visual language of high-end print journalism and brought to life with fluid page-turn animations.",
    body: [
      "The brief was self-imposed and therefore uncompromising: build a portfolio that does not look like a portfolio. The prevailing language of the modern developer site — rounded cards, soft gradients, hero videos — was deliberately set aside in favour of something with more authority: the broadsheet.",
      "The design system, documented in full before a single component was written, is built on the tension between two values: Newsreader (serif) as the editorial voice and Public Sans as the functional counterpoint. Every typographic decision is a deliberate nod to print journalism — tight tracking on display headlines, ragged-right body copy, all-caps Work Sans for metadata.",
      "Technically, the project runs on Next.js 16 with the App Router, styled entirely through Tailwind CSS v4's new CSS-native theme system. Framer Motion drives the newspaper page-turn transition between routes — a 3D rotateY animation anchored at the layout level so both the exit and enter animations fire correctly across navigation.",
      "Performance and SEO were treated as first-class constraints throughout. Static generation at build time, font subsetting via next/font, priority image loading on the hero, and structured OpenGraph metadata ensure the site is fast to load and easy to find.",
      "While the core design and vision are entirely my own, I leveraged AI to accelerate the implementation. I believe strong fundamentals are the blueprint for any great project, and AI serves as a powerful collaborator to refine concepts and bring that foundation to life."
    ],
    quote:
      '"Just try it and keep learning new skills and tools."',
    quoteAttribution: "— Kevin Chiputra, on designing this site",
    outcome:
      "A fully static, zero-runtime-dependency portfolio shipping at 100 Lighthouse performance on mobile.",
    image: "/project/Project1.png",
    imageAlt: "The Portfolio Gazette — personal website screenshot",
    imageLeft: true,
  },
];
