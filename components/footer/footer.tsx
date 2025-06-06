import { mainMenu } from '@/menu.config';
import Link from 'next/link';
import {
  addressLine1,
  addressLine2,
  emailAddress,
  llcName,
} from '@/app/contsants/constants';
import { Separator } from '../ui/separator';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer>
      <Separator />
      <section className="w-full my-8 p-12 text-lg">
        <div className="flex flex-wrap justify-between gap-8 px-3 py-4">
          <div className="w-full md:w-[29%] flex flex-col text-center">
            <h5 className="text-2xl font-semibold leading-none tracking-tight pb-6">
              Site Map
            </h5>
            <div className="flex flex-col gap-2 text-md mb-8">
              {Object.entries(mainMenu).map(([key, href]) => (
                <Link
                  className="hover:underline underline-offset-4"
                  key={href}
                  href={href}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Link>
              ))}
            </div>
          </div>
          <div className="w-full md:w-[29%] flex flex-col text-center items-center">
            <h5 className="text-2xl font-semibold leading-none tracking-tight pb-6">
              Contact
            </h5>
            <div className="pb-4">
              <div className="flex items-center mb-2">
                <Link
                  href="https://www.instagram.com/zerovisioncinema/"
                  target="_blank"
                  className="flex"
                >
                  <Image
                    className="mx-2"
                    height={24}
                    width={24}
                    alt="instagram social media icon"
                    src="https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/Instagram_Glyph_Gradient-cytRhDzf7XqHFRst9K38AotJg5pZ4i-acvkd6WqNAueeDECSqXGXbojnbEaCP.svg"
                  />
                  Follow Us On Instagram
                </Link>
              </div>
              <strong>
                <Link href={`mailto:${emailAddress}`} target="_blank">
                  {emailAddress}
                </Link>
              </strong>
            </div>
          </div>
          <div className="w-full md:w-[29%] flex flex-col text-center items-center">
            <h5 className="text-2xl font-semibold leading-none tracking-tight pb-6">
              Address
            </h5>
            <address className="not-italic text-md">
              <strong>{llcName}</strong>
              <p>{addressLine1}</p>
              <p>{addressLine2}</p>
            </address>
          </div>
        </div>
      </section>
    </footer>
  );
};

export default Footer;
