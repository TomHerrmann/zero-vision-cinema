import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import {
  ADDRESS_LINE_1,
  ADDRESS_LINE_2,
  EMAIL_FONT_BOOTZY_CONDENSED_URL,
  EMAIL_FONT_BOOTZY_URL,
  EMAIL_LOGO_PRIMARY_WHITE_URL,
  LLC_NAME,
} from '@/app/contsants/constants';

/**
 * Shared look for every ZVC email, from the brand guide
 * (ZVC-Visual Identity-Final.pdf). Colors are solid hex only: Windows Outlook
 * ignores rgba(), so tints are pre-mixed against Blackout.
 */
export const BLACKOUT = '#1F1F1F';
export const GLOW = '#FFFDF6';
export const RETRO_BLUE = '#9EB7CC';
export const BLUE_LIGHT = '#4A8CC6';
export const CULT_CLASSIC = '#7F0028';
export const STATIC = '#D9DDE0';
/** Glow at ~5% over Blackout — panels. */
export const PANEL = '#2A2A29';
/** Static at ~14% over Blackout — hairlines. */
export const HAIRLINE = '#3A3B3B';
/** Secondary text on the Glow ticket card. */
export const INK_SOFT = '#4A4A48';

/**
 * Font stacks. Bootzy is declared at weight 700 so clients that load it never
 * fake-bold it, and clients that don't (Gmail, Outlook on Windows, Yahoo) fall
 * back to bold Arial, the brand's stated fallback. Crimson Text falls back to
 * Georgia.
 */
export const HEADLINE_FONT =
  "'Bootzy Condensed', 'Arial Narrow', Arial, Helvetica, sans-serif";
export const LABEL_FONT = "'Bootzy', Arial, Helvetica, sans-serif";
export const BODY_FONT = "'Crimson Text', Georgia, 'Times New Roman', serif";

/** Inner width of the 600px column (28px side padding). */
export const CONTENT_WIDTH = 544;

const headCss = `
@import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,700;1,400&display=swap');
@font-face { font-family: 'Bootzy Condensed'; font-weight: 700; font-style: normal;
  src: url('${EMAIL_FONT_BOOTZY_CONDENSED_URL}.woff2') format('woff2'), url('${EMAIL_FONT_BOOTZY_CONDENSED_URL}.woff') format('woff'); }
@font-face { font-family: 'Bootzy'; font-weight: 700; font-style: normal;
  src: url('${EMAIL_FONT_BOOTZY_URL}.woff2') format('woff2'), url('${EMAIL_FONT_BOOTZY_URL}.woff') format('woff'); }
body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
a { color: ${BLUE_LIGHT}; }
@media screen and (max-width: 480px) {
  .zvc-pad { padding-left: 18px !important; padding-right: 18px !important; }
  .zvc-stack { display: block !important; width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; }
  .zvc-stack-gap { padding-bottom: 20px !important; }
  .zvc-title { font-size: 40px !important; }
  .zvc-poster { width: 120px !important; height: auto !important; }
}
/* Outlook.com / Outlook apps in dark mode: keep the Glow ticket light. */
[data-ogsb] .zvc-ticket { background-color: ${GLOW} !important; }
[data-ogsc] .zvc-ticket-ink { color: ${BLACKOUT} !important; }
[data-ogsc] .zvc-admit { color: ${CULT_CLASSIC} !important; }
`;

/** Html/Head/Body/600px container shared by every email. */
export function EmailShell({
  preview,
  children,
}: {
  preview: string;
  children: React.ReactNode;
}) {
  return (
    <Html lang="en">
      <Head>
        {/* Already dark: tell Apple Mail / iOS not to auto-invert it. */}
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
        <style>{headCss}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>{children}</Container>
      </Body>
    </Html>
  );
}

/** Centered plain white primary logo over a hairline. */
export function BrandHeader() {
  return (
    <Section style={headerStyle}>
      <Img
        src={EMAIL_LOGO_PRIMARY_WHITE_URL}
        width="200"
        alt="Zero Vision Cinema"
        style={logoStyle}
      />
    </Section>
  );
}

export function Kicker({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: 'left' | 'center';
}) {
  return <Text style={{ ...kickerStyle, textAlign: align }}>{children}</Text>;
}

export function Title({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: 'left' | 'center';
}) {
  return (
    <h1 className="zvc-title" style={{ ...titleStyle, textAlign: align }}>
      {children}
    </h1>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={sectionTitleStyle}>{children}</h2>;
}

/** Small uppercase label, e.g. "When", "About the Film". */
export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={labelStyle}>{children}</Text>;
}

/** Label/value row; skipped when the value is empty. */
export function Row({
  label,
  value,
  emphasize,
  last,
}: {
  label: string;
  value?: string | null;
  emphasize?: boolean;
  last?: boolean;
}) {
  if (!value) return null;
  const border = last || emphasize ? 'none' : `1px solid ${HAIRLINE}`;
  return (
    <table
      width="100%"
      cellPadding="0"
      cellSpacing="0"
      role="presentation"
      style={{ borderBottom: border }}
    >
      <tr>
        <td style={emphasize ? rowLabelEmphasis : rowLabel}>{label}</td>
        <td style={emphasize ? rowValueEmphasis : rowValue}>{value}</td>
      </tr>
    </table>
  );
}

/** Filled Cult Classic button (Glow text passes contrast; Blue Light doesn't). */
export function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Button href={href} style={primaryButtonStyle}>
      {children}
    </Button>
  );
}

export function OutlineButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Button href={href} style={outlineButtonStyle}>
      {children}
    </Button>
  );
}

/**
 * Footer with the postal address every email needs (CAN-SPAM requires it on
 * marketing mail). `children` are the extra lines: support links, unsubscribe.
 */
export function BrandFooter({ children }: { children?: React.ReactNode }) {
  return (
    <Section style={footerStyle}>
      <Text style={footerName}>{LLC_NAME}</Text>
      <Text style={footerText}>
        {ADDRESS_LINE_1}, {ADDRESS_LINE_2}
      </Text>
      {children}
    </Section>
  );
}

export function FooterLine({ children }: { children: React.ReactNode }) {
  return <Text style={footerText}>{children}</Text>;
}

export function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} style={footerLinkStyle}>
      {children}
    </Link>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

export const bodyStyle: React.CSSProperties = {
  backgroundColor: BLACKOUT,
  fontFamily: BODY_FONT,
  color: GLOW,
  margin: 0,
  padding: '24px 0',
};
export const containerStyle: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: BLACKOUT,
};
const headerStyle: React.CSSProperties = {
  padding: '8px 28px 20px',
  borderBottom: `1px solid ${HAIRLINE}`,
  textAlign: 'center',
};
const logoStyle: React.CSSProperties = {
  display: 'block',
  margin: '0 auto',
  width: '200px',
  maxWidth: '200px',
  height: 'auto',
};
/** Standard content padding — keep in step with CONTENT_WIDTH. */
export const contentStyle: React.CSSProperties = { padding: '36px 28px 0' };
export const kickerStyle: React.CSSProperties = {
  fontFamily: LABEL_FONT,
  fontWeight: 700,
  fontSize: '13px',
  letterSpacing: '0.25em',
  textTransform: 'uppercase',
  color: RETRO_BLUE,
  margin: '0 0 10px',
};
export const titleStyle: React.CSSProperties = {
  fontFamily: HEADLINE_FONT,
  fontWeight: 700,
  letterSpacing: '0.05em',
  fontSize: '48px',
  lineHeight: '0.98',
  textTransform: 'uppercase',
  color: GLOW,
  margin: '0 0 14px',
};
export const sectionTitleStyle: React.CSSProperties = {
  fontFamily: HEADLINE_FONT,
  fontWeight: 700,
  letterSpacing: '0.05em',
  fontSize: '28px',
  lineHeight: '1.1',
  textTransform: 'uppercase',
  color: GLOW,
  margin: '0 0 12px',
};
export const labelStyle: React.CSSProperties = {
  fontFamily: LABEL_FONT,
  fontWeight: 700,
  fontSize: '12px',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: RETRO_BLUE,
  margin: '0 0 6px',
};
export const bodyTextStyle: React.CSSProperties = {
  fontFamily: BODY_FONT,
  fontSize: '18px',
  lineHeight: '1.55',
  color: GLOW,
  margin: '0 0 20px',
};
export const mutedTextStyle: React.CSSProperties = {
  fontFamily: BODY_FONT,
  fontSize: '16px',
  lineHeight: '1.5',
  color: STATIC,
  margin: '0 0 12px',
};
export const panelStyle: React.CSSProperties = {
  backgroundColor: PANEL,
  borderRadius: '6px',
  padding: '18px 22px',
  margin: '0 0 24px',
};
export const linkStyle: React.CSSProperties = {
  color: BLUE_LIGHT,
  textDecoration: 'underline',
};
const rowLabel: React.CSSProperties = {
  fontFamily: BODY_FONT,
  fontSize: '16px',
  color: STATIC,
  padding: '10px 12px 10px 0',
  verticalAlign: 'top',
  width: '40%',
};
const rowValue: React.CSSProperties = {
  fontFamily: BODY_FONT,
  fontSize: '16px',
  color: GLOW,
  padding: '10px 0',
  textAlign: 'right',
  verticalAlign: 'top',
};
const rowLabelEmphasis: React.CSSProperties = {
  ...rowLabel,
  fontFamily: LABEL_FONT,
  fontWeight: 700,
  fontSize: '13px',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: GLOW,
  paddingTop: '16px',
  verticalAlign: 'middle',
};
const rowValueEmphasis: React.CSSProperties = {
  ...rowValue,
  fontFamily: HEADLINE_FONT,
  fontWeight: 700,
  letterSpacing: '0.05em',
  fontSize: '26px',
  paddingTop: '12px',
  verticalAlign: 'middle',
};
const buttonBase: React.CSSProperties = {
  fontFamily: LABEL_FONT,
  fontWeight: 700,
  fontSize: '15px',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  textDecoration: 'none',
  borderRadius: '4px',
  padding: '15px 30px',
  display: 'inline-block',
};
export const primaryButtonStyle: React.CSSProperties = {
  ...buttonBase,
  backgroundColor: CULT_CLASSIC,
  color: GLOW,
};
export const outlineButtonStyle: React.CSSProperties = {
  ...buttonBase,
  fontSize: '13px',
  padding: '12px 22px',
  color: GLOW,
  border: `1px solid ${STATIC}`,
};
const footerStyle: React.CSSProperties = {
  marginTop: '44px',
  padding: '26px 28px 34px',
  borderTop: `1px solid ${HAIRLINE}`,
  textAlign: 'center',
};
const footerName: React.CSSProperties = {
  fontFamily: LABEL_FONT,
  fontWeight: 700,
  fontSize: '12px',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: GLOW,
  margin: '0 0 6px',
};
const footerText: React.CSSProperties = {
  fontFamily: BODY_FONT,
  fontSize: '14px',
  lineHeight: '1.6',
  color: STATIC,
  margin: '0 0 4px',
};
const footerLinkStyle: React.CSSProperties = {
  color: STATIC,
  textDecoration: 'underline',
};
