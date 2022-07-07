import Link from "next/link";

import { useIsEmbed } from "@calcom/embed-core/embed-iframe";
import { useLocale } from "@calcom/lib/hooks/useLocale";

const PoweredByCal = () => {
  const { t } = useLocale();
  const isEmbed = useIsEmbed();
  return (
    <div className={"p-1 text-center text-xs sm:text-right" + (isEmbed ? " max-w-3xl" : "")}>
      <Link href="https://movewithpulse.com/?utm_source=embed&amp;utm_medium=powered-by-button">
        <a target="_blank" className="text-bookinglight opacity-50 hover:opacity-100 dark:text-white">
          {t("powered_by")}{" "}
          {
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="relative -mt-px inline h-6 w-auto dark:hidden"
              src="/pulse-logo.svg"
              alt="Move With Pulse Logo"
            />
          }
          {
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="relative -mt-px hidden h-6 w-auto dark:inline"
              src="/pulse-logo-light.svg"
              alt="Move With Pulse Logo"
            />
          }
        </a>
      </Link>
    </div>
  );
};

export default PoweredByCal;
