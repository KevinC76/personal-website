import { z } from "zod";

const text = z.string().trim().min(1).max(500);
const prose = z.string().trim().min(1).max(10000);
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/);
export const safeUrl = z
  .string()
  .max(2000)
  .refine((value) => {
    if (/^\/(?!\/)[a-zA-Z0-9/#?&=._%-]*$/.test(value)) return true;
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "Use an HTTPS URL or a relative site path.");
const link = z.object({ label: text, href: safeUrl }).strict();
const stat = z.object({ value: text, label: text }).strict();
const seo = z
  .object({
    title: z.string().trim().min(1).max(100),
    description: z.string().trim().min(1).max(300),
  })
  .strict();
export const mediaSchema = z
  .object({
    id,
    path: z
      .string()
      .regex(
        /^(\/(hero-optimized\.jpg|project\/Project1-optimized\.jpg)|[0-9a-f-]{36}\.webp)$/,
      ),
    alt: text,
    width: z.number().int().positive().max(1600),
    height: z.number().int().positive().max(10000),
  })
  .strict();
export const projectSchema = z
  .object({
    id,
    label: text,
    title: text,
    year: text,
    tags: z.array(text).max(20),
    summary: prose,
    body: z.array(prose).max(30),
    quote: prose,
    quoteAttribution: text,
    outcome: prose,
    image: id,
    imageAlt: text,
    imageLeft: z.boolean(),
  })
  .strict();
export const portfolioSchema = z
  .object({
    schemaVersion: z.literal(1),
    brand: z
      .object({
        name: text,
        edition: text,
        price: text,
        footerQuote: prose,
        copyright: text,
        navigation: z.array(link).max(10),
        social: z.array(link).max(10),
      })
      .strict(),
    profile: z
      .object({
        name: text,
        issue: text,
        role: text,
        intro: prose,
        projectCount: text,
        established: text,
        sectors: z.array(text).max(20),
        photo: id,
        deskTitle: text,
        deskBody: prose,
        stats: z.array(stat).max(8),
        articles: z
          .array(
            z.object({ label: text, headline: text, body: prose }).strict(),
          )
          .max(10),
        cvUrl: safeUrl,
      })
      .strict(),
    about: z
      .object({
        eyebrow: text,
        intro: prose,
        title: text,
        paragraphs: z.array(prose).max(20),
        quote: prose,
        stats: z.array(stat).max(8),
        disciplines: z
          .array(z.object({ label: text, body: prose }).strict())
          .max(20),
        experience: z
          .array(
            z
              .object({
                period: text,
                role: text,
                company: text,
                desc: prose,
                achievements: z.array(prose).max(30),
              })
              .strict(),
          )
          .max(40),
      })
      .strict(),
    skills: z
      .array(z.object({ num: id, title: text, desc: prose }).strict())
      .max(40),
    projects: z.array(projectSchema).max(50),
    featuredProjectId: id.or(z.literal("")),
    contact: z
      .object({
        title: text,
        intro: prose,
        email: z.string().email().max(254),
        success: text,
        successDetail: prose,
      })
      .strict(),
    labels: z
      .object({
        skillsTitle: text,
        skillsSubtitle: text,
        projectsTitle: text,
        projectsEyebrow: text,
        projectsIntro: prose,
        archiveIntro: prose,
        aboutLink: text,
        cvLink: text,
        projectsLink: text,
        projectStoryLink: text,
        disciplinesTitle: text,
        experienceTitle: text,
        ctaTitle: text,
        ctaBody: prose,
        contactLink: text,
        backLink: text,
        emptyProjects: prose,
      })
      .strict(),
    seo: z.object({ home: seo, about: seo, projects: seo }).strict(),
    media: z.array(mediaSchema).max(100),
  })
  .strict()
  .superRefine((data, ctx) => {
    const unique = (ids: string[], path: string) => {
      if (new Set(ids).size !== ids.length)
        ctx.addIssue({
          code: "custom",
          message: "IDs must be unique.",
          path: [path],
        });
    };
    unique(
      data.projects.map((p) => p.id),
      "projects",
    );
    unique(
      data.media.map((m) => m.id),
      "media",
    );
    unique(
      data.skills.map((s) => s.num),
      "skills",
    );
    const mediaIds = new Set(data.media.map((m) => m.id));
    if (!mediaIds.has(data.profile.photo))
      ctx.addIssue({
        code: "custom",
        message: "Select an existing portrait.",
        path: ["profile", "photo"],
      });
    data.projects.forEach((p, i) => {
      if (!mediaIds.has(p.image))
        ctx.addIssue({
          code: "custom",
          message: "Select an existing image.",
          path: ["projects", i, "image"],
        });
    });
    if (
      data.featuredProjectId &&
      !data.projects.some((p) => p.id === data.featuredProjectId)
    )
      ctx.addIssue({
        code: "custom",
        message: "Featured project must exist.",
        path: ["featuredProjectId"],
      });
  });
export type PortfolioContent = z.infer<typeof portfolioSchema>;
export type MediaAsset = z.infer<typeof mediaSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Snapshot = {
  document: PortfolioContent;
  revision: number;
  updated_at: string;
};
export type PageKey = "home" | "about" | "projects";
export function referencedMedia(content: PortfolioContent) {
  const ids = new Set([
    content.profile.photo,
    ...content.projects.map((p) => p.image),
  ]);
  return content.media.filter((m) => ids.has(m.id));
}
