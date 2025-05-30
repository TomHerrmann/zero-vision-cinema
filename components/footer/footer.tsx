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
      <section className="w-full my-8 px-12 flex flex-col md:flex-row md:justify-around gap-4">
        <div className="grid grid-cols-2 gap-4 m-8 p-6">
          <div className="flex-col justify-center">
            <h5 className="text-2xl font-semibold leading-none tracking-tight pb-8">
              Site Map
            </h5>
            <div className="flex flex-col gap-2 text-md mb-12">
              {Object.entries(mainMenu).map(([key, href]) => (
                <Link
                  className="hover:underline underline-offset-4"
                  key={href}
                  href={href}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Link>
              ))}
            </div>{' '}
          </div>
          <div className="flex-col">
            <h5 className="text-2xl font-semibold leading-none tracking-tight pb-8">
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
