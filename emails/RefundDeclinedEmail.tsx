import { Section, Text } from '@react-email/components';
import { LLC_NAME, ZVC_EMAIL_ADDRESS } from '@/app/contsants/constants';
import {
  BrandFooter,
  BrandHeader,
  EmailShell,
  FooterLine,
  FooterLink,
  Row,
  bodyTextStyle,
  contentStyle,
  panelStyle,
} from './components/brand';

/**
 * Wording for the email a buyer gets when we decline their refund request.
 * Tom & Mary's to write. While `paragraphs` is empty, no decline email is sent
 * (the decision panel says so) and you reply to the buyer yourself.
 */
export const REFUND_DECLINED_COPY: {
  subject: string;
  paragraphs: string[];
} = {
  subject: '',
  paragraphs: [],
};

export const refundDeclinedEmailReady = () =>
  Boolean(REFUND_DECLINED_COPY.subject && REFUND_DECLINED_COPY.paragraphs.length);

interface Props {
  eventName: string;
  orderNumber: number;
}

export default function RefundDeclinedEmail({ eventName, orderNumber }: Props) {
  return (
    <EmailShell preview={REFUND_DECLINED_COPY.subject}>
      <BrandHeader />
      <Section style={contentStyle} className="zvc-pad">
        {REFUND_DECLINED_COPY.paragraphs.map((p, i) => (
          <Text key={i} style={bodyTextStyle}>
            {p}
          </Text>
        ))}
        <Section style={panelStyle}>
          <Row label="Order #" value={`${orderNumber}`} />
          <Row label="Event" value={eventName} last />
        </Section>
      </Section>
      <BrandFooter>
        <FooterLine>
          Support:{' '}
          <FooterLink href={`mailto:${ZVC_EMAIL_ADDRESS}`}>{ZVC_EMAIL_ADDRESS}</FooterLink>
        </FooterLine>
        <FooterLine>
          © {new Date().getFullYear()} {LLC_NAME}
        </FooterLine>
      </BrandFooter>
    </EmailShell>
  );
}
