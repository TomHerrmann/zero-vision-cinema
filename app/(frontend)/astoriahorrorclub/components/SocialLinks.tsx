import {
  AHC_INSTAGRAM_ICON_SVG_URL,
  AHC_INSTAGRAM_URL,
  DISCORD_ICON_SVG_URL,
} from '../../../contsants/constants';
import Image from 'next/image';

export default function SocialLinks() {
  return (
    <div className="flex flex-col flex-wrap items-center w-full justify-between">
      <span className="flex items-center mb-2 mr-3">
        Join Our Discord{' '}
        <a href={process.env.DISCORD_INVITE_URL} target="_blank">
          <Image
            height={24}
            width={24}
            alt="discord social media icon"
            src={DISCORD_ICON_SVG_URL}
          />
        </a>
      </span>
      <span className="flex items-center mb-2">
        Follow Us On Instagram{' '}
        <a href={AHC_INSTAGRAM_URL} target="_blank">
          <Image
            height={24}
            width={24}
            alt="instagram social media icon"
            src={AHC_INSTAGRAM_ICON_SVG_URL}
          />
        </a>
      </span>
    </div>
  );
}
