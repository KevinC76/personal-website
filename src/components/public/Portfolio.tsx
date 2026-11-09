import Link from "next/link";
import type {
  PortfolioContent,
  MediaAsset,
  PageKey,
  Project,
} from "@/lib/content/schema";
import { PUBLIC_BUCKET } from "@/lib/config";
import EditorialImage from "./EditorialImage";
import ContactForm from "./ContactForm";
import { EditorialArrow } from "./Motion";

type Props = {
  content: PortfolioContent;
  page: PageKey;
  previewSources?: Record<string, string>;
};
function imageUrl(asset: MediaAsset) {
  return asset.path.startsWith("/")
    ? asset.path
    : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PUBLIC_BUCKET}/${asset.path}`;
}
function Picture({
  content,
  id,
  previewSources,
  portrait = false,
  priority = false,
  alt,
}: {
  content: PortfolioContent;
  id: string;
  previewSources?: Record<string, string>;
  portrait?: boolean;
  priority?: boolean;
  alt?: string;
}) {
  const asset = content.media.find((m) => m.id === id);
  if (!asset) return <div className="aspect-video bg-surface-container-high" />;
  return (
    <figure
      className={`relative overflow-hidden bg-surface-container-high ${portrait ? "aspect-[4/3] grayscale" : "aspect-video"}`}
    >
      <EditorialImage
        key={asset.path}
        src={previewSources?.[asset.id] ?? imageUrl(asset)}
        alt={alt ?? asset.alt}
        sizes="(max-width: 1024px) 100vw, 55vw"
        priority={priority}
        privateImage={Boolean(previewSources)}
      />
    </figure>
  );
}
function Stats({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <dl className="flex flex-wrap gap-x-10 gap-y-6 border-t border-current/15 py-6">
      {stats.map((s, i) => (
        <div key={i}>
          <dt className="eyebrow mt-2">{s.label}</dt>
          <dd className="font-headline text-4xl font-extrabold -order-1">
            {s.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
function Masthead({
  content,
  page,
}: {
  content: PortfolioContent;
  page: PageKey;
}) {
  return (
    <header className="site-width pt-6 border-b-[3px] border-black">
      <div className="flex items-center justify-between gap-6 mb-5">
        <span className="eyebrow hidden xl:block">{content.brand.edition}</span>
        <Link
          href="/"
          className="font-headline uppercase font-extrabold tracking-tighter text-2xl md:text-4xl text-center mx-auto border-b-4 border-black pb-1"
        >
          {content.brand.name}
        </Link>
        <span className="eyebrow hidden xl:block">{content.brand.price}</span>
      </div>
      <nav
        aria-label="Main navigation"
        className="flex justify-center flex-wrap gap-6 py-3"
      >
        {content.brand.navigation.map((l, i) => (
          <Link
            key={i}
            className="eyebrow nav-link"
            href={l.href}
            aria-current={
              l.href ===
              { home: "/", about: "/about", projects: "/projects" }[page]
                ? "page"
                : undefined
            }
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
function Footer({ content }: { content: PortfolioContent }) {
  return (
    <footer className="site-width py-12 mt-10 border-t border-black/20 text-center space-y-6">
      <p className="font-headline text-xl italic">
        “{content.brand.footerQuote}”
      </p>
      <nav
        aria-label="Footer navigation"
        className="flex flex-wrap justify-center gap-6"
      >
        {content.brand.navigation.map((l, i) => (
          <Link href={l.href} key={i} className="eyebrow nav-link">
            {l.label}
          </Link>
        ))}
      </nav>
      <p className="eyebrow">
        © {new Date().getFullYear()} {content.brand.copyright}
      </p>
      <div className="flex flex-wrap justify-center gap-6">
        {content.brand.social.map((l, i) => (
          <a
            key={i}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="eyebrow nav-link"
          >
            {l.label}
          </a>
        ))}
      </div>
    </footer>
  );
}
function ProjectStory({
  project,
  content,
  previewSources,
  full = false,
}: {
  project: Project;
  content: PortfolioContent;
  previewSources?: Record<string, string>;
  full?: boolean;
}) {
  return (
    <article className="border-t border-white/20 pt-8" data-reveal>
      <div className="flex flex-wrap justify-between gap-4 mb-8">
        <span className="eyebrow">
          {project.label} · {project.year}
        </span>
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag, i) => (
            <span key={i} className="eyebrow border border-white/30 px-2 py-1">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-12 items-center">
        <div
          className={`lg:col-span-7 ${!project.imageLeft ? "lg:order-2" : ""}`}
        >
          <Picture
            content={content}
            id={project.image}
            alt={project.imageAlt}
            previewSources={previewSources}
          />
        </div>
        <div className="lg:col-span-5">
          <h2 className="font-headline text-3xl md:text-5xl font-bold leading-tight">
            {project.title}
          </h2>
          <p className="font-headline italic text-xl my-6 leading-relaxed">
            {project.summary}
          </p>
          {full ? (
            <p className="eyebrow border-t border-white/20 pt-4">
              {project.outcome}
            </p>
          ) : (
            <Link href="/projects" className="text-link">
              {content.labels.projectStoryLink} <EditorialArrow />
            </Link>
          )}
        </div>
      </div>
      {full && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7 mt-10 border-t border-white/20 pt-8 text-sm leading-relaxed">
          {project.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
      <blockquote className="border-l-4 border-current pl-6 mt-10 max-w-3xl">
        <p className="font-headline italic text-2xl">{project.quote}</p>
        <cite className="eyebrow not-italic block mt-3">
          {project.quoteAttribution}
        </cite>
      </blockquote>
    </article>
  );
}
function Home({ content: c, previewSources }: Omit<Props, "page">) {
  const p = c.profile;
  const featured =
    c.projects.find((p) => p.id === c.featuredProjectId) ?? c.projects[0];
  return (
    <>
      <div className="site-width">
        <section
          id="hero"
          className="grid lg:grid-cols-2 gap-10 lg:gap-14 py-10 md:py-14 border-b-4 border-black"
        >
          <div className="lg:pr-12 lg:border-r border-black/20">
            <p className="eyebrow inline-block bg-black text-white px-3 py-2 mb-6">
              {p.issue}
            </p>
            <h1 className="font-headline italic tracking-tighter text-6xl md:text-8xl leading-[.95] mb-6 break-words">
              {p.name}.
            </h1>
            <p className="leading-relaxed text-lg text-black/75">{p.intro}</p>
            <div className="flex flex-wrap gap-4 border-y border-black py-3 my-6 eyebrow">
              <span>{p.projectCount}</span>
              <span>{p.role}</span>
              <span>{p.established}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-8">
              {p.sectors.map((s, i) => (
                <span
                  className="eyebrow border border-black/30 px-2 py-1"
                  key={i}
                >
                  {s}
                </span>
              ))}
            </div>
            <Picture
              content={c}
              id={p.photo}
              previewSources={previewSources}
              portrait
              priority
            />
          </div>
          <div className="space-y-10">
            <div className="border-b-2 border-black pb-8">
              <h2 className="section-title">{p.deskTitle}</h2>
              <p className="font-headline text-2xl italic leading-snug my-5">
                {p.deskBody}
              </p>
              <Stats stats={p.stats} />
              <p className="font-headline italic text-2xl">— {p.name}</p>
              <p className="eyebrow mt-2 mb-6">{p.role}</p>
              <Link href="/about" className="text-link">
                {c.labels.aboutLink} <EditorialArrow />
              </Link>
            </div>
            {p.articles.map((a, i) => (
              <article key={i} className="border-b border-black/15 pb-8">
                <p className="eyebrow underline underline-offset-4 mb-3">
                  {a.label}
                </p>
                <h3 className="font-headline text-2xl font-bold mb-3">
                  {a.headline}
                </h3>
                <p className="leading-relaxed text-black/75">{a.body}</p>
              </article>
            ))}
            <a
              className="ink-button"
              href={p.cvUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {c.labels.cvLink} ↓
            </a>
          </div>
        </section>
        <section id="tools" className="py-14" data-reveal>
          <div className="flex items-center gap-5 mb-8">
            <h2 className="section-title">{c.labels.skillsTitle}</h2>
            <span className="h-0.5 bg-black grow" />
            <p className="eyebrow hidden md:block">{c.labels.skillsSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-black/20">
            {c.skills.map((s) => (
              <article
                key={s.num}
                className="p-6 border-r border-b border-black/20 paper-card"
              >
                <p className="eyebrow mb-3">No. {s.num}</p>
                <h3 className="font-headline font-bold text-xl mb-3">
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed">{s.desc}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
      <section id="projects" className="bg-black text-[#e2e2e2] py-14">
        <div className="site-width">
          <p className="eyebrow mb-3">{c.labels.projectsEyebrow}</p>
          <h2 className="display-title">{c.labels.projectsTitle}</h2>
          <p className="max-w-xl my-8 leading-relaxed">
            {c.labels.projectsIntro}
          </p>
          {featured ? (
            <ProjectStory
              project={featured}
              content={c}
              previewSources={previewSources}
            />
          ) : (
            <p>{c.labels.emptyProjects}</p>
          )}
          <Link
            className="inline-flex border border-white px-6 py-3 mt-12 text-link"
            href="/projects"
          >
            {c.labels.projectsLink} <EditorialArrow />
          </Link>
        </div>
      </section>
      <div className="site-width">
        <ContactForm content={c.contact} disabled={Boolean(previewSources)} />
      </div>
    </>
  );
}
function About({ content: c, previewSources }: Omit<Props, "page">) {
  const a = c.about;
  return (
    <>
      <section className="bg-black text-[#e2e2e2] py-14">
        <div className="site-width">
          <p className="eyebrow mb-4">{a.eyebrow}</p>
          <div className="grid lg:grid-cols-3 gap-8 items-end">
            <h1 className="display-title lg:col-span-2">{c.profile.name}.</h1>
            <p className="text-sm leading-relaxed">{a.intro}</p>
          </div>
          <div className="mt-10">
            <Stats stats={a.stats} />
          </div>
        </div>
      </section>
      <div className="site-width py-14">
        <section className="grid lg:grid-cols-12 gap-10 pb-16 border-b-2 border-black">
          <div className="lg:col-span-5">
            <Picture
              content={c}
              id={c.profile.photo}
              previewSources={previewSources}
              portrait
            />
            <p className="eyebrow mt-3">
              {c.profile.name} — {c.profile.role}
            </p>
          </div>
          <div className="lg:col-span-7">
            <h2 className="section-title mb-6">{a.title}</h2>
            <div className="grid md:grid-cols-2 gap-6 leading-relaxed">
              {a.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <blockquote className="font-headline italic text-2xl border-l-4 border-black pl-6 mt-10">
              “{a.quote}”
            </blockquote>
          </div>
        </section>
        <section className="py-14" data-reveal>
          <h2 className="section-title mb-8">{c.labels.disciplinesTitle}</h2>
          <div className="grid md:grid-cols-3 border-t border-l border-black/20">
            {a.disciplines.map((d, i) => (
              <article
                key={i}
                className="p-6 border-b border-r border-black/20 paper-card"
              >
                <p className="eyebrow mb-5">0{i + 1}</p>
                <h3 className="font-headline font-bold text-2xl mb-4">
                  {d.label}
                </h3>
                <p className="text-sm leading-relaxed">{d.body}</p>
              </article>
            ))}
          </div>
        </section>
        <section data-reveal>
          <h2 className="section-title mb-8">{c.labels.experienceTitle}</h2>
          {a.experience.map((e, i) => (
            <article
              key={i}
              className="grid md:grid-cols-4 gap-6 border-t border-black/20 py-8"
            >
              <div className="eyebrow space-y-3">
                <p>{e.period}</p>
                <p>{e.company}</p>
              </div>
              <div className="md:col-span-3">
                <h3 className="font-headline text-2xl font-bold mb-3">
                  {e.role}
                </h3>
                <p className="text-sm leading-relaxed mb-4">{e.desc}</p>
                <ul className="list-disc pl-4 space-y-2 text-sm leading-relaxed">
                  {e.achievements.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </section>
        <section className="border-t-2 border-black pt-10 mt-10 flex flex-wrap justify-between gap-6">
          <div>
            <h2 className="section-title">{c.labels.ctaTitle}</h2>
            <p className="mt-3">{c.labels.ctaBody}</p>
          </div>
          <Link href="/#contact" className="ink-button self-start">
            {c.labels.contactLink} <EditorialArrow />
          </Link>
        </section>
      </div>
    </>
  );
}
function Projects({ content: c, previewSources }: Omit<Props, "page">) {
  return (
    <section className="bg-black text-[#e2e2e2] py-14">
      <div className="site-width">
        <h1 className="display-title">{c.labels.projectsTitle}</h1>
        <p className="max-w-xl my-8 leading-relaxed">{c.labels.archiveIntro}</p>
        <div className="space-y-24">
          {c.projects.length ? (
            c.projects.map((p) => (
              <ProjectStory
                key={p.id}
                project={p}
                content={c}
                previewSources={previewSources}
                full
              />
            ))
          ) : (
            <p className="py-10">{c.labels.emptyProjects}</p>
          )}
        </div>
        <Link href="/" className="text-link mt-14 inline-block">
          ← {c.labels.backLink}
        </Link>
      </div>
    </section>
  );
}
export default function Portfolio({ content, page, previewSources }: Props) {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Masthead content={content} page={page} />
      <main id="main-content">
        {page === "home" ? (
          <Home content={content} previewSources={previewSources} />
        ) : page === "about" ? (
          <About content={content} previewSources={previewSources} />
        ) : (
          <Projects content={content} previewSources={previewSources} />
        )}
      </main>
      <Footer content={content} />
    </>
  );
}
