import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getAllSlugs, getPostBySlug, getAllPosts } from '@/lib/blog/posts';
import { BlogPostContent } from './BlogPostContent';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return { title: 'Post Not Found | TaskForce Tickets' };
  }

  return {
    title: `${post.title} | TaskForce Tickets`,
    description: post.excerpt,
    keywords: post.keywords,
    openGraph: {
      title: post.ogTitle,
      description: post.ogDescription,
      type: 'article',
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const allPosts = getAllPosts();
  const currentIndex = allPosts.findIndex((p) => p.slug === post.slug);
  const relatedPosts = allPosts
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Organization',
      name: 'TaskForce Tickets',
      url: 'https://www.taskforcetickets.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'TaskForce Tickets',
      url: 'https://www.taskforcetickets.com',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.taskforcetickets.com/blog/${post.slug}`,
    },
  };

  return (
    <>
      <Header />
      <main className="pt-24">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Article Header */}
        <section className="bg-[#1A1A1A] py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-6">
            <Link
              href="/blog"
              className="inline-flex items-center text-white/50 hover:text-[#FFD100] transition-colors mb-6 text-sm"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Blog
            </Link>
            <p className="text-[#FFD100] text-sm font-medium mb-3">
              {new Date(post.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              {post.title}
            </h1>
          </div>
        </section>

        {/* Article Body */}
        <section className="bg-white py-16">
          <div className="max-w-3xl mx-auto px-6">
            <BlogPostContent content={post.content} />
          </div>
        </section>

        {/* CTA Banner */}
        <section className="bg-[#FFD100] py-12">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-3">
              Ready to Fight Your Ticket?
            </h2>
            <p className="text-[#1A1A1A]/70 mb-6 max-w-xl mx-auto">
              Submit your citation in 60 seconds. An attorney handles everything
              — no court appearance required. Money-back guarantee.
            </p>
            <Link
              href="/intake"
              className="inline-block bg-[#1A1A1A] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#333] transition-colors"
            >
              Submit Your Ticket Now
            </Link>
          </div>
        </section>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="bg-[#F8F8F8] py-16">
            <div className="max-w-4xl mx-auto px-6">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-8">
                More from the Blog
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/blog/${related.slug}`}
                    className="group"
                  >
                    <article className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow h-full">
                      <p className="text-xs text-[#4A4A4A]/60 mb-2">
                        {new Date(related.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <h3 className="font-bold text-[#1A1A1A] group-hover:text-[#4A4A4A] transition-colors mb-2 line-clamp-3">
                        {related.title}
                      </h3>
                      <p className="text-sm text-[#4A4A4A]/80 line-clamp-3">
                        {related.excerpt}
                      </p>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
