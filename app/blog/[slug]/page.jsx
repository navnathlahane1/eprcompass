import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, User, ArrowLeft } from "lucide-react";
import { getPostBySlug, getAllSlugs, posts } from "@/lib/blogPosts";

const SITE_URL = "http://localhost:3000";

export function generateStaticParams() {
  return getAllSlugs();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };
  const description = post.metaDescription || post.summary;
  const url = `${SITE_URL}/blog/${post.slug}`;
  const image = post.image?.startsWith("http") ? post.image : `${SITE_URL}${post.image}`;
  return {
    title: post.title,
    description,
    keywords: (post.tags || []).join(", "),
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description,
      url,
      siteName: "EPR Compass",
      type: "article",
      locale: "en_IN",
      publishedTime: post.date,
      authors: [post.author],
      images: [{ url: image, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [image],
    },
  };
}

function inlineHtml(text) {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-eco-green-4 underline underline-offset-2 hover:text-eco-green-5">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function renderBody(text) {
  if (!text) return null;
  return text.split(/\n\n+/).map((block, i) => {
    const trimmed = block.trim();
    if (trimmed.startsWith("## ")) {
      return (
        <h2 key={i} className="text-2xl font-bold mt-10 mb-4 text-gray-900 dark:text-white">
          {trimmed.slice(3)}
        </h2>
      );
    }
    if (/^[-*]\s/m.test(trimmed)) {
      const items = trimmed.split("\n").filter((l) => /^[-*]\s/.test(l.trim()));
      return (
        <ul key={i} className="list-disc pl-6 mb-4 space-y-1 text-gray-700 dark:text-gray-300">
          {items.map((item, j) => (
            <li key={j} dangerouslySetInnerHTML={{ __html: inlineHtml(item.replace(/^[-*]\s/, "")) }} />
          ))}
        </ul>
      );
    }
    if (/^\d+\.\s/m.test(trimmed)) {
      const items = trimmed.split("\n").filter((l) => /^\d+\.\s/.test(l.trim()));
      return (
        <ol key={i} className="list-decimal pl-6 mb-4 space-y-1 text-gray-700 dark:text-gray-300">
          {items.map((item, j) => (
            <li key={j} dangerouslySetInnerHTML={{ __html: inlineHtml(item.replace(/^\d+\.\s/, "")) }} />
          ))}
        </ol>
      );
    }
    return (
      <p
        key={i}
        className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: inlineHtml(trimmed) }}
      />
    );
  });
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const image = post.image?.startsWith("http") ? post.image : `${SITE_URL}${post.image}`;
  const related = posts
    .filter((p) => p.slug !== post.slug && p.tags?.some((t) => post.tags?.includes(t)))
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription || post.summary,
    image,
    datePublished: post.date,
    author: { "@type": "Organization", name: post.author, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "EPR Compass",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/imgs/epr-compass/epr-compass-platform.png` },
    },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    keywords: (post.tags || []).join(", "),
    about: "Extended Producer Responsibility (EPR) in India",
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-eco-green-4 hover:text-eco-green-5 font-medium mb-8"
        >
          <ArrowLeft size={20} />
          Back to all posts
        </Link>

        <header className="mb-10">
          <div className="flex flex-wrap gap-4 text-gray-500 dark:text-gray-400 text-sm mb-4">
            <span className="flex items-center gap-1">
              <Calendar size={18} /> {post.date}
            </span>
            <span className="flex items-center gap-1">
              <User size={18} /> {post.author}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-eco-green-4/20 text-eco-green-4 text-xs font-medium">
              {post.category}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-tangent mb-4">
            {post.title}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {post.summary}
          </p>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10 shadow-lg">
          <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">{renderBody(post.body)}</div>

        <div className="mt-10 rounded-2xl border border-eco-green-4/30 bg-eco-green-4/5 p-6">
          <h2 className="text-xl font-bold mb-2">Need help with EPR compliance?</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            EPR Compass handles CPCB registration, EPR certificates, plastic / e-waste / battery filings and annual returns for PIBOs across India.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" className="px-4 py-2 rounded-lg bg-eco-green-4 text-white font-medium hover:bg-eco-green-5">
              Talk to an EPR expert
            </Link>
            <Link href="/epr-calculator" className="px-4 py-2 rounded-lg border border-eco-green-4 text-eco-green-4 font-medium">
              EPR calculator
            </Link>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-4">Related EPR guides</h2>
            <ul className="space-y-2">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/blog/${r.slug}`} className="text-eco-green-4 hover:underline">
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-eco-green-4 hover:text-eco-green-5 font-medium"
          >
            <ArrowLeft size={20} />
            Back to all posts
          </Link>
        </div>
      </article>
    </main>
  );
}

