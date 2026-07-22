import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPayload } from 'payload';
import payloadConfig from '@/payload.config';
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
    <main className="relative min-h-screen overflow-hidden bg-blackout">
      {/* Texture */}
      <div className="absolute inset-0 zvc-grain pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 py-24 md:py-32 pt-32 md:pt-40">
        <article>
          <header className="mb-12">
            <span className="zvc-kicker block mb-4">Editorial</span>
            <h1 className="zvc-heading text-4xl md:text-6xl lg:text-7xl mb-6">
              {article.title}
            </h1>
            {article.author && (
              <p className="zvc-body text-glow/60">
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
                className="w-full h-96 object-cover border-2 border-glow/15 shadow-[6px_6px_0_0_rgba(0,0,0,0.55)] zvc-worn-edge"
              />
            </div>
          )}

          <div className="prose prose-lg prose-invert zvc-article max-w-none">
            <RichText data={article.body} />
          </div>
        </article>
      </div>
    </main>
  );
}
