import Image from 'next/image';
import { ArrowUpRight, Newspaper } from 'lucide-react';
import { ZVC_SUBSTACK_URL } from '@/app/contsants/constants';
import { cn } from '@/utils/utils';
import type { SubstackPost } from '@/utils/getLatestSubstackPosts';
import SectionHeading from '../ui/section-heading';
import SubstackIcon from '../ui/substack-icon';

const SUBSCRIBE_URL = new URL('subscribe', ZVC_SUBSTACK_URL).toString();

const formatPostDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  });

/**
 * `featured` is the single-post layout (image beside text from md up);
 * otherwise cards stack image-over-text so several fit in a row.
 */
function PostCard({
  post,
  featured,
}: {
  post: SubstackPost;
  featured: boolean;
}) {
  return (
    <article
      className={cn(
        'zvc-card group flex flex-col h-full overflow-hidden',
        featured && 'md:flex-row'
      )}
    >
      <div
        className={cn(
          'relative w-full aspect-video overflow-hidden bg-blackout',
          featured && 'md:w-1/2 md:aspect-auto md:min-h-[320px]'
        )}
      >
        {post.imageUrl ? (
          <Image
            src={post.imageUrl}
            alt=""
            fill
            sizes={
              featured
                ? '(min-width: 768px) 50vw, 100vw'
                : '(min-width: 768px) 33vw, 100vw'
            }
            className="object-cover group-hover:brightness-90 transition"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <SubstackIcon className="w-12 h-12 text-glow/20" />
          </div>
        )}
      </div>

      <div
        className={cn(
          'flex flex-col flex-1 p-6 md:p-8',
          featured && 'md:p-10 lg:p-12 md:justify-center'
        )}
      >
        {post.publishedAt && (
          <time
            dateTime={post.publishedAt}
            className="zvc-kicker text-sm mb-3"
          >
            {formatPostDate(post.publishedAt)}
          </time>
        )}
        <h3
          className={cn(
            'font-display uppercase text-glow leading-none mb-4',
            featured ? 'text-3xl md:text-4xl lg:text-5xl' : 'text-2xl md:text-3xl'
          )}
        >
          {post.title}
        </h3>
        {post.subtitle && (
          <p
            className={cn(
              'zvc-body text-glow/70 leading-relaxed mb-8',
              featured ? 'text-lg md:text-xl' : 'text-base line-clamp-3'
            )}
          >
            {post.subtitle}
          </p>
        )}
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="zvc-btn self-start mt-auto"
        >
          Read the Article
          <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

type Props = { posts: SubstackPost[] };

export default function SubstackSection({ posts }: Props) {
  if (posts.length === 0) return null;

  const featured = posts.length === 1;

  return (
    <section
      id="substack"
      className="relative py-24 md:py-32 overflow-hidden bg-blackout"
    >
      {/* Texture */}
      <div
        className="absolute inset-0 zvc-scanlines pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 zvc-grain pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12">
        <SectionHeading
          kicker="From the Substack"
          title="Latest Posts"
          icon={Newspaper}
          className="mb-16"
        />

        <div
          className={cn(
            'grid gap-8 md:gap-10',
            !featured && 'md:grid-cols-2 lg:grid-cols-3'
          )}
        >
          {posts.map((post) => (
            <PostCard key={post.url} post={post} featured={featured} />
          ))}
        </div>

        {/* Subscribe CTA */}
        <div className="text-center pt-16">
          <p className="zvc-body text-lg md:text-xl text-glow/70 mb-6">
            Get new reviews and writing delivered straight to your inbox.
          </p>
          <a
            href={SUBSCRIBE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="zvc-btn-outline text-lg py-4"
          >
            <SubstackIcon className="w-4 h-4" />
            Subscribe on Substack
          </a>
        </div>
      </div>
    </section>
  );
}
