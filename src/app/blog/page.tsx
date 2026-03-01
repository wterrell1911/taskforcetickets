import Link from 'next/link';
import { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getAllPosts } from '@/lib/blog/posts';

export const metadata: Metadata = {
  title: 'Blog | TaskForce Tickets — Memphis Traffic Ticket Tips & Guides',
  description:
    'Expert guides on fighting traffic tickets in Memphis, navigating 201 Poplar, understanding your rights, and saving money on traffic violations in Shelby County.',
  keywords: [
    'memphis traffic ticket blog',
    'memphis traffic court guide',
    'fight traffic ticket memphis tips',
    'tennessee traffic ticket help',
    '201 poplar tips',
  ],
  openGraph: {
    title: 'Blog | TaskForce Tickets',
    description:
      'Expert guides on fighting traffic tickets in Memphis and Shelby County.',
    type: 'website',
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <>
      <Header />
      <main className="pt-24">
        {/* Hero */}
        <section className="bg-[#1A1A1A] py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
              TaskForce Tickets <span className="text-[#FFD100]">Blog</span>
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Guides, tips, and everything you need to know about fighting
              traffic tickets in Memphis and Shelby County.
            </p>
          </div>
        </section>

        {/* Post List */}
        <section className="bg-white py-20">
          <div className="max-w-4xl mx-auto px-6">
            <div className="space-y-10">
              {posts.map((post) => (
                <article
                  key={post.slug}
                  className="border-b border-[#E5E5E5] pb-10 last:border-none"
                >
                  <p className="text-sm text-[#4A4A4A]/60 mb-2">
                    {new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <Link href={`/blog/${post.slug}`}>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] hover:text-[#4A4A4A] transition-colors mb-3">
                      {post.title}
                    </h2>
                  </Link>
                  <p className="text-[#4A4A4A] leading-relaxed mb-4">
                    {post.excerpt}
                  </p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center text-[#1A1A1A] font-semibold hover:text-[#FFD100] transition-colors"
                  >
                    Read More
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#1A1A1A] py-16">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Got a Ticket? We Can Help.
            </h2>
            <p className="text-white/70 mb-8">
              Skip the courthouse. An attorney handles everything for a flat fee.
              Money-back guarantee.
            </p>
            <Link
              href="/intake"
              className="inline-block bg-[#FFD100] text-[#1A1A1A] px-8 py-4 rounded-lg text-lg font-semibold hover:brightness-105 transition-all"
            >
              Submit Your Ticket Now
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
