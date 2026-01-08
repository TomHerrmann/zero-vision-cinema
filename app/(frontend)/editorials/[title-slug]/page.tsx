import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPayload } from 'payload';
import payloadConfig from '@/payload.config';
import { cn } from '@/utils/utils';
import Image from 'next/image';
import { RichText } from '@payloadcms/richtext-lexical/react';

type Props = {
  params: Promise<{
    'title-slug': string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'title-slug': titleSlug } = await params;

  const payload = await getPayload({ config: payloadConfig });

  const { docs } = await payload.find({
    collection: 'articles',
    where: {
      slug: { equals: titleSlug },
      category: { equals: 'editorial' },
      _status: { equals: 'published' },
    },
    depth: 1,
  });

  if (docs.length === 0) {
    return { title: 'Editorial Not Found' };
  }

  const article = docs[0];

  return {
    title: article.title,
    description: `Read our editorial: ${article.title}`,
  };
}

export default async function EditorialPage({ params }: Props) {
  const { 'title-slug': titleSlug } = await params;

  const payload = await getPayload({ config: payloadConfig });

  const { docs } = await payload.find({
    collection: 'articles',
    where: {
      slug: { equals: titleSlug },
      category: { equals: 'editorial' },
      _status: { equals: 'published' },
    },
    depth: 2, // to get author details
  });

  if (docs.length === 0) {
    notFound();
  }

  const article = docs[0];

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at center, oklch(0.987 0.026 102.212) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 py-24 md:py-32">
        <article>
          <header className="mb-12">
            <h1
              className={cn(
                'font-rubik-glitch text-4xl md:text-6xl lg:text-7xl',
                'leading-none mb-6',
                'bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent'
              )}
            >
              {article.title}
            </h1>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-lg text-foreground/70">Editorial</span>
            </div>
            {article.author && (
              <p className="text-foreground/60">
                By{' '}
                {typeof article.author === 'object'
                  ? article.author.name
                  : article.author}
              </p>
            )}
          </header>

          {article.image && typeof article.image !== 'number' && (
            <div className="mb-12">
              <Image
                src={article.image.url!}
                alt={article.title}
                width={article.image.width ?? 1200}
                height={article.image.height ?? 675}
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>
          )}

          <div className="prose prose-lg max-w-none">
            <RichText data={article.body} />
          </div>
        </article>
      </div>
    </main>
  );
}
