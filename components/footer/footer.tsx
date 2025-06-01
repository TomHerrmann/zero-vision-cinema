import { mainMenu } from '@/menu.config';
import Link from 'next/link';
import {
  addressLine1,
  addressLine2,
  emailAddress,
  llcName,
} from '@/app/contsants/constants';
import { Separator } from '../ui/separator';

const Footer = () => {
  return (
    <footer>
      <Separator />
      <section className="w-full my-8 p-12 text-lg">
        <div className="flex flex-wrap justify-between gap-8 px-6 py-8">
          {/* Site Map */}
          <div className="w-full md:w-[48%] flex flex-col text-center">
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
          {/* Contact */}
          <div className="w-full md:w-[48%] flex flex-col text-center">
            <h5 className="text-2xl font-semibold leading-none tracking-tight pb-6">
              Contact
            </h5>
            <div className="pb-4">
              <strong>
                <Link href={`mailto:${emailAddress}`}>{emailAddress}</Link>
              </strong>
            </div>
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
