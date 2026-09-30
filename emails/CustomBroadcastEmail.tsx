import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import {
  RichText,
  type JSXConvertersFunction,
} from '@payloadcms/richtext-lexical/react';
import { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import {
  EMAIL_HEADER_IMAGE_ZVC_URL,
  LLC_NAME,
  RESEND_UNSUBSCRIBE_URL,
} from '@/app/contsants/constants';
import { richTextIsEmpty } from '@/utils/richText';
import {
  main,
  container,
  header,
  content,
  heading as headingStyle,
  richTextWrap,
  button,
  footer,
  footerText,
  footerLink,
} from './BroadcastEmail';

export type CustomBroadcastImage = {
  url: string;
  alt?: string;
  /** Intrinsic pixel size from the Media doc — drives the display width. */
  width?: number | null;
  height?: number | null;
};

export interface CustomBroadcastEmailProps {
  /** Inbox preview line; also the fallback headline. */
  subject: string;
  heading?: string | null;
  images?: CustomBroadcastImage[];
  body?: SerializedEditorState | null;
  cta?: { label: string; url: string } | null;
}

/** Container (600) minus the content section's 28px side padding. */
export const CONTENT_WIDTH = 544;
/** Portrait images are held narrower so a poster doesn't run three screens tall. */
const PORTRAIT_WIDTH = 360;
const PORTRAIT_RATIO = 1.2;

/**
 * Display width for an uploaded image of any size. Wide and square images fill
 * the column, portrait ones are capped narrower, and nothing is ever scaled up
 * past its own pixels. Height is never set, so the aspect ratio always holds
 * and nothing is cropped. Unknown dimensions fall back to the full column.
 */
export function emailImageWidth(
  width?: number | null,
  height?: number | null
): number {
  if (!width || !height) return CONTENT_WIDTH;
  const cap = height / width > PORTRAIT_RATIO ? PORTRAIT_WIDTH : CONTENT_WIDTH;
  return Math.min(Math.round(width), cap);
}

// Inline styles on every body element: several clients drop <style> blocks, and
// a bare <a> would otherwise render default-blue on the dark background.
const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  paragraph: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children });
    return <p style={paragraph}>{children?.length ? children : <br />}</p>;
  },
  heading: ({ node, nodesToJSX }) => {
    const Tag = node.tag;
    return (
      <Tag style={subheading}>{nodesToJSX({ nodes: node.children })}</Tag>
    );
  },
  list: ({ node, nodesToJSX }) => {
    const Tag = node.tag;
    return <Tag style={list}>{nodesToJSX({ nodes: node.children })}</Tag>;
  },
  listitem: ({ node, nodesToJSX }) => (
    <li style={listItem}>{nodesToJSX({ nodes: node.children })}</li>
  ),
  link: ({ node, nodesToJSX }) => (
    <a href={node.fields.url ?? '#'} target="_blank" style={bodyLink}>
      {nodesToJSX({ nodes: node.children })}
    </a>
  ),
  autolink: ({ node, nodesToJSX }) => (
    <a href={node.fields.url ?? '#'} target="_blank" style={bodyLink}>
      {nodesToJSX({ nodes: node.children })}
    </a>
  ),
});

export default function CustomBroadcastEmail({
  subject,
  heading,
  images = [],
  body,
  cta,
}: CustomBroadcastEmailProps) {
  const headline = heading?.trim() || subject;

  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={EMAIL_HEADER_IMAGE_ZVC_URL}
            width="100%"
            alt={LLC_NAME}
            style={header}
          />
          <Section style={content}>
            <Heading style={headingStyle}>{headline}</Heading>

            {images.map((image, i) => {
              const width = emailImageWidth(image.width, image.height);
              return (
                <Img
                  key={`${image.url}-${i}`}
                  src={image.url}
                  alt={image.alt ?? ''}
                  // The attribute is what Outlook desktop sizes by (it ignores
                  // max-width); the style is what lets phones scale it down.
                  width={width}
                  style={{ ...imageStyle, maxWidth: `${width}px` }}
                />
              );
            })}

            {!richTextIsEmpty(body) && (
              <div style={bodyWrap}>
                <RichText data={body!} converters={converters} />
              </div>
            )}

            {cta?.label && cta?.url && (
              <Section style={ctaWrap}>
                <Button href={cta.url} style={button}>
                  {cta.label}
                </Button>
              </Section>
            )}
          </Section>

          <Section style={footer}>
            <Text style={footerText}>{LLC_NAME}</Text>
            <Text style={footerText}>
              You&apos;re receiving this because you subscribed to Zero Vision
              Cinema updates.{' '}
              <Link href={RESEND_UNSUBSCRIBE_URL} style={footerLink}>
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const imageStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  height: 'auto',
  margin: '0 auto 20px',
  border: '0',
};
const bodyWrap: React.CSSProperties = {
  ...richTextWrap,
  fontSize: '15px',
  margin: '0 0 8px',
  // A long pasted URL must wrap rather than widen the layout on a phone.
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
};
const paragraph: React.CSSProperties = {
  color: 'rgba(255,253,246,0.8)',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};
const subheading: React.CSSProperties = {
  color: '#FFFDF6',
  fontSize: '20px',
  lineHeight: '1.25',
  margin: '24px 0 10px',
};
const list: React.CSSProperties = {
  color: 'rgba(255,253,246,0.8)',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 16px',
  paddingLeft: '22px',
};
const listItem: React.CSSProperties = { margin: '0 0 6px' };
const bodyLink: React.CSSProperties = {
  color: '#4A8CC6',
  textDecoration: 'underline',
};
const ctaWrap: React.CSSProperties = {
  textAlign: 'center',
  margin: '12px 0 0',
};
