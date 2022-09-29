import { InstallAppButtonWithoutPlanCheck } from "@calcom/app-store/components";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import type { App } from "@calcom/types/App";
import Button from "@calcom/ui/v2/core/Button";

interface ICalendarItem {
  title: string;
  description?: string;
  imageSrc: string;
  type: App["type"];
}

function ConnectButtonContent({ type }) {
  const { t } = useLocale();

  if (type === "google_calendar") {
    return (
      <>
        <img
          className="h-[34px] w-auto"
          height="34px"
          alt="Sign in with Google"
          title="Sign in with Google"
          src="/btn_google_signin_light_normal_web.png"
        />
      </>
    );
  }

  return <span className="rounded-md py-9 px-4 text-sm font-bold">{t("connect")}</span>;
}

const CalendarItem = (props: ICalendarItem) => {
  const { title, imageSrc, type } = props;
  return (
    <div className="flex flex-row items-center p-5">
      <img src={imageSrc} alt={title} className="h-8 w-8" />
      <p className="mx-3 text-sm font-bold">{title}</p>

      <InstallAppButtonWithoutPlanCheck
        type={type}
        render={(buttonProps) => (
          <Button
            {...buttonProps}
            color="secondary"
            type="button"
            onClick={(event) => {
              // Save cookie key to return url step
              document.cookie = `return-to=${window.location.href};path=/;max-age=3600;SameSite=Lax`;
              buttonProps && buttonProps.onClick && buttonProps?.onClick(event);
            }}
            className="ml-auto rounded-none px-0 py-0">
            <ConnectButtonContent type={type} />
          </Button>
        )}
      />
    </div>
  );
};

export { CalendarItem };
