import { CheckIcon } from "@heroicons/react/outline";
import { ArrowLeftIcon, ClockIcon, XIcon } from "@heroicons/react/solid";
import classNames from "classnames";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import timezone from "dayjs/plugin/timezone";
import toArray from "dayjs/plugin/toArray";
import utc from "dayjs/plugin/utc";
import { createEvent } from "ics";
import { GetServerSidePropsContext } from "next";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import RRule from "rrule";

import {
  useEmbedNonStylesConfig,
  useIsBackgroundTransparent,
  useIsEmbed,
} from "@calcom/embed-core/embed-iframe";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { localStorage } from "@calcom/lib/webstorage";

import { asStringOrUndefined, asNumberOrThrow } from "@lib/asStringOrNull";
import { getEventName } from "@lib/event";
import useTheme from "@lib/hooks/useTheme";
import prisma from "@lib/prisma";
import { collectPageParameters, telemetryEventTypes, useTelemetry } from "@lib/telemetry";
import { isBrowserLocale24h } from "@lib/timeFormat";
import { inferSSRProps } from "@lib/types/inferSSRProps";

import CustomBranding from "@components/CustomBranding";
import CancelBooking from "@components/booking/CancelBooking";
import { HeadSeo } from "@components/seo/head-seo";

import { ssrInit } from "@server/lib/ssr";

dayjs.extend(utc);
dayjs.extend(toArray);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);

type SuccessProps = inferSSRProps<typeof getServerSideProps>;

export default function Success(props: SuccessProps) {
  const { t } = useLocale();
  const router = useRouter();
  const { location: _location, name, reschedule, status, isSuccessBookingPage } = router.query;
  const location = Array.isArray(_location) ? _location[0] : _location;
  const [is24h, setIs24h] = useState(isBrowserLocale24h());

  const [date, setDate] = useState(dayjs.utc(props.date));
  const { eventType, bookingInfo } = props;

  const isBackgroundTransparent = useIsBackgroundTransparent();
  const isEmbed = useIsEmbed();
  const shouldAlignCentrallyInEmbed = useEmbedNonStylesConfig("align") !== "left";
  const shouldAlignCentrally = !isEmbed || shouldAlignCentrallyInEmbed;
  const [isCancellationMode, setIsCancellationMode] = useState(false);

  const attendeeName = typeof name === "string" ? name : "Nameless";

  const locationFromEventType = !!eventType?.locations
    ? (eventType.locations as Array<{ type: string }>)[0]
    : "";
  const locationType = !!locationFromEventType ? locationFromEventType.type : "";
  const eventNameObject = {
    attendeeName,
    eventType: props.eventType?.title as string,
    eventName: (props.dynamicEventName as string) || props.eventType?.eventName,
    host: props.profile.name || "Nameless",
    location: locationType,
    t,
  };
  const metadata = props.eventType?.metadata as { giphyThankYouPage: string };
  const giphyImage = metadata?.giphyThankYouPage;

  const eventName = getEventName(eventNameObject, true);
  const needsConfirmation = eventType?.requiresConfirmation && reschedule != "true";
  const isCancelled = status === "CANCELLED" || status === "REJECTED";
  const telemetry = useTelemetry();
  useEffect(() => {
    if (top !== window) {
      //page_view will be collected automatically by _middleware.ts
      telemetry.event(telemetryEventTypes.embedView, collectPageParameters("/success"));
    }
  }, [telemetry]);

  useEffect(() => {
    setDate(date.tz(localStorage.getItem("timeOption.preferredTimeZone") || dayjs.tz.guess()));
    setIs24h(!!localStorage.getItem("timeOption.is24hClock"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, needsConfirmation]);

  function eventLink(): string {
    const optional: { location?: string } = {};
    if (location) {
      optional["location"] = location;
    }

    const event = createEvent({
      start: [
        date.toDate().getUTCFullYear(),
        (date.toDate().getUTCMonth() as number) + 1,
        date.toDate().getUTCDate(),
        date.toDate().getUTCHours(),
        date.toDate().getUTCMinutes(),
      ],
      startInputType: "utc",
      title: eventName,
      description: props.eventType?.description ?? undefined,
      /** formatted to required type of description ^ */
      duration: { minutes: props.eventType?.length },
      ...optional,
    });

    if (event.error) {
      throw event.error;
    }

    return encodeURIComponent(event.value ? event.value : false);
  }

  function getTitle(): string {
    const titleSuffix = props.recurringBookings ? "_recurring" : "";
    if (isCancelled) {
      return t("emailed_information_about_cancelled_event");
    }
    if (needsConfirmation) {
      if (props.profile.name !== null) {
        return t("user_needs_to_confirm_or_reject_booking" + titleSuffix, {
          user: props.profile.name,
        });
      }
      return t("needs_to_be_confirmed_or_rejected" + titleSuffix);
    }
    return t("emailed_you_and_attendees" + titleSuffix);
  }
  const { isReady, Theme } = useTheme(isSuccessBookingPage ? props.profile.theme : "light");
  const title = t(
    `booking_${needsConfirmation ? "submitted" : "confirmed"}${props.recurringBookings ? "_recurring" : ""}`
  );
  const customInputs = bookingInfo?.customInputs;
  return (
    (isReady && (
      <>
        <div
          className={isEmbed ? "" : "h-screen bg-neutral-100 dark:bg-neutral-900"}
          data-testid="success-page">
          <Theme />
          <HeadSeo title={title} description={title} />
          <CustomBranding lightVal={props.profile.brandColor} darkVal={props.profile.darkBrandColor} />
          <main className={classNames(shouldAlignCentrally ? "mx-auto" : "", isEmbed ? "" : "max-w-3xl")}>
            <div className={classNames("overflow-y-auto", isEmbed ? "" : "z-50 ")}>
              <div
                className={classNames(
                  shouldAlignCentrally ? "text-center" : "",
                  "flex items-end justify-center px-4 pt-4 pb-20  sm:block sm:p-0"
                )}>
                <div
                  className={classNames("my-4 transition-opacity sm:my-0", isEmbed ? "" : " inset-0")}
                  aria-hidden="true">
                  <div
                    className={classNames(
                      "inline-block transform overflow-hidden rounded-md border sm:my-8 sm:max-w-lg",
                      isBackgroundTransparent ? "" : "bg-white dark:border-neutral-700 dark:bg-gray-800",
                      "px-8 pt-5 pb-4 text-left align-bottom transition-all sm:w-full  sm:py-6 sm:align-middle"
                    )}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-headline">
                    <div>
                      <div
                        className={classNames(
                          "mx-auto flex items-center justify-center",
                          !giphyImage && !isCancelled ? "h-12 w-12 rounded-full bg-green-100" : "",
                          isCancelled ? "h-12 w-12 rounded-full bg-red-100" : ""
                        )}>
                        {giphyImage && !needsConfirmation && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={giphyImage} alt={"Gif from Giphy"} />
                        )}
                        {!giphyImage && !needsConfirmation && !isCancelled && (
                          <CheckIcon className="h-8 w-8 text-green-600" />
                        )}
                        {needsConfirmation && !isCancelled && (
                          <ClockIcon className="h-8 w-8 text-green-600" />
                        )}
                        {isCancelled && <XIcon className="h-8 w-8 text-red-600" />}
                      </div>
                      <div className="mt-3 text-center sm:mt-5">
                        <h3
                          className="text-2xl font-semibold leading-6 text-neutral-900 dark:text-white"
                          id="modal-headline">
                          {needsConfirmation && !isCancelled
                            ? props.recurringBookings
                              ? t("submitted_recurring")
                              : t("submitted")
                            : isCancelled
                            ? t("event_cancelled")
                            : props.recurringBookings
                            ? t("meeting_is_scheduled_recurring")
                            : t("meeting_is_scheduled")}
                        </h3>
                        <div className="mt-3">
                          <p className="text-sm text-neutral-600 dark:text-gray-300">{getTitle()}</p>
                        </div>
                        <div className="border-bookinglightest text-bookingdark mt-4 grid grid-cols-3 border-t border-b py-4 text-left dark:border-gray-900 dark:text-gray-300">
                          <div className="font-medium">{t("what")}</div>
                          <div className="col-span-2 mb-6">{eventName}</div>
                          <div className="font-medium">{t("when")}</div>
                          <div className="col-span-2 mb-6">
                            {date.format("MMMM DD, YYYY")}
                            <br />
                            {date.format("LT")} -{" "}
                            {date.add(asNumberOrThrow(eventType?.length), "m").format("LT")}{" "}
                            <span className="text-bookinglight">
                              ({localStorage.getItem("timeOption.preferredTimeZone") || dayjs.tz.guess()})
                            </span>
                          </div>
                          {(bookingInfo?.user || bookingInfo?.attendees) && (
                            <>
                              <div className="font-medium">{t("who")}</div>
                              <div className="col-span-2 mb-6">
                                {bookingInfo?.user && (
                                  <div className="mb-3">
                                    <p>{bookingInfo.user.name}</p>
                                    <p className="text-bookinglight">{bookingInfo.user.email}</p>
                                  </div>
                                )}
                                {bookingInfo?.attendees.map((attendee, index: number) => (
                                  <div
                                    key={attendee.name}
                                    className={index === bookingInfo.attendees.length - 1 ? "" : "mb-3"}>
                                    <p>{attendee.name}</p>
                                    <p className="text-bookinglight">{attendee.email}</p>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                          {location && (
                            <>
                              <div className="mt-3 font-medium">{t("where")}</div>
                              <div className="col-span-2 mt-3">
                                {location.startsWith("http") ? (
                                  <a title="Meeting Link" href={location}>
                                    {location}
                                  </a>
                                ) : (
                                  location
                                )}
                              </div>
                            </>
                          )}
                          {bookingInfo?.description && (
                            <>
                              <div className="mt-9 font-medium">{t("additional_notes")}</div>
                              <div className="col-span-2 mb-2 mt-9">
                                <p>{bookingInfo.description}</p>
                              </div>
                            </>
                          )}
                          {customInputs &&
                            Object.keys(customInputs).map((key) => {
                              const customInput = customInputs[key as keyof typeof customInputs];
                              return (
                                <>
                                  {customInput !== "" && (
                                    <>
                                      <div className="mt-2 pr-3 font-medium">{key}</div>
                                      <div className="col-span-2 mt-2 mb-2">
                                        {typeof customInput === "boolean" ? (
                                          <p>{customInput ? "true" : "false"}</p>
                                        ) : (
                                          <p>{customInput}</p>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                    {!needsConfirmation &&
                      !isCancelled &&
                      (!isCancellationMode ? (
                        <div className="border-bookinglightest text-bookingdark mt-2 grid grid-cols-3 border-b py-4 text-left dark:border-gray-900">
                          <span className="flex self-center font-medium text-gray-700 ltr:mr-2 rtl:ml-2 dark:text-gray-50">
                            {t("need_to_make_a_change")}
                          </span>
                          <div className="ml-7 flex items-center justify-center self-center ltr:mr-2 rtl:ml-2 dark:text-gray-50">
                            <button className="underline" onClick={() => setIsCancellationMode(true)}>
                              {t("cancel")}
                            </button>
                            {!props.recurringBookings && (
                              <>
                                <div className="mx-2">{t("or_lowercase")}</div>
                                <div className="underline">
                                  <Link href={"/reschedule/" + bookingInfo?.uid}>{t("Reschedule")}</Link>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <CancelBooking
                          booking={{ uid: bookingInfo?.uid, title: bookingInfo?.title }}
                          profile={{ name: props.profile.name, slug: props.profile.slug }}
                          recurringEvent={null}
                          team={eventType?.team?.name}
                          setIsCancellationMode={setIsCancellationMode}
                          theme={isSuccessBookingPage ? props.profile.theme : "light"}
                        />
                      ))}
                    {!needsConfirmation && !isCancellationMode && !isCancelled && (
                      <div className="mt-9 flex pt-2 pb-4 text-center sm:mt-0 sm:pt-4">
                        <span className="flex self-center font-medium text-gray-700 ltr:mr-2 rtl:ml-2 dark:text-gray-50">
                          {t("add_to_calendar")}
                        </span>
                        <div className="-ml-16 flex flex-grow justify-center text-center">
                          <Link
                            href={
                              `https://calendar.google.com/calendar/r/eventedit?dates=${date
                                .utc()
                                .format("YYYYMMDDTHHmmss[Z]")}/${date
                                .add(asNumberOrThrow(props?.eventType?.length), "minute")
                                .utc()
                                .format("YYYYMMDDTHHmmss[Z]")}&text=${eventName}&details=${
                                props?.eventType?.description
                              }` +
                              (typeof location === "string"
                                ? "&location=" + encodeURIComponent(location)
                                : "")
                            }>
                            <a className="mx-2 h-10 w-10 rounded-sm border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:text-white">
                              <svg
                                className="-mt-1 inline-block h-4 w-4"
                                fill="currentColor"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24">
                                <title>Google</title>
                                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                              </svg>
                            </a>
                          </Link>
                          <Link
                            href={
                              encodeURI(
                                "https://outlook.live.com/calendar/0/deeplink/compose?body=" +
                                  props.eventType?.description +
                                  "&enddt=" +
                                  date
                                    .add(asNumberOrThrow(props.eventType?.length), "minute")
                                    .utc()
                                    .format() +
                                  "&path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&startdt=" +
                                  date.utc().format() +
                                  "&subject=" +
                                  eventName
                              ) + (location ? "&location=" + location : "")
                            }>
                            <a
                              className="mx-2 h-10 w-10 rounded-sm border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:text-white"
                              target="_blank">
                              <svg
                                className="mr-1 -mt-1 inline-block h-4 w-4"
                                fill="currentColor"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24">
                                <title>Microsoft Outlook</title>
                                <path d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75.3-.3.75-.3h12.9q.44 0 .75.3.3.3.3.75V10.85l1.24.72h.01q.1.07.18.18.07.12.07.25zm-6-8.25v3h3v-3zm0 4.5v3h3v-3zm0 4.5v1.83l3.05-1.83zm-5.25-9v3h3.75v-3zm0 4.5v3h3.75v-3zm0 4.5v2.03l2.41 1.5 1.34-.8v-2.73zM9 3.75V6h2l.13.01.12.04v-2.3zM5.98 15.98q.9 0 1.6-.3.7-.32 1.19-.86.48-.55.73-1.28.25-.74.25-1.61 0-.83-.25-1.55-.24-.71-.71-1.24t-1.15-.83q-.68-.3-1.55-.3-.92 0-1.64.3-.71.3-1.2.85-.5.54-.75 1.3-.25.74-.25 1.63 0 .85.26 1.56.26.72.74 1.23.48.52 1.17.81.69.3 1.56.3zM7.5 21h12.39L12 16.08V17q0 .41-.3.7-.29.3-.7.3H7.5zm15-.13v-7.24l-5.9 3.54Z" />
                              </svg>
                            </a>
                          </Link>
                          <Link
                            href={
                              encodeURI(
                                "https://outlook.office.com/calendar/0/deeplink/compose?body=" +
                                  props?.eventType?.description +
                                  "&enddt=" +
                                  date
                                    .add(asNumberOrThrow(props?.eventType?.length), "minute")
                                    .utc()
                                    .format() +
                                  "&path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&startdt=" +
                                  date.utc().format() +
                                  "&subject=" +
                                  eventName
                              ) + (location ? "&location=" + location : "")
                            }>
                            <a
                              className="mx-2 h-10 w-10 rounded-sm border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:text-white"
                              target="_blank">
                              <svg
                                className="mr-1 -mt-1 inline-block h-4 w-4"
                                fill="currentColor"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24">
                                <title>Microsoft Office</title>
                                <path d="M21.53 4.306v15.363q0 .807-.472 1.433-.472.627-1.253.85l-6.888 1.974q-.136.037-.29.055-.156.019-.293.019-.396 0-.72-.105-.321-.106-.656-.292l-4.505-2.544q-.248-.137-.391-.366-.143-.23-.143-.515 0-.434.304-.738.304-.305.739-.305h5.831V4.964l-4.38 1.563q-.533.187-.856.658-.322.472-.322 1.03v8.078q0 .496-.248.912-.25.416-.683.651l-2.072 1.13q-.286.148-.571.148-.497 0-.844-.347-.348-.347-.348-.844V6.563q0-.62.33-1.19.328-.571.874-.881L11.07.285q.248-.136.534-.21.285-.075.57-.075.211 0 .38.031.166.031.364.093l6.888 1.899q.384.11.7.329.317.217.547.52.23.305.353.67.125.367.125.764zm-1.588 15.363V4.306q0-.273-.16-.478-.163-.204-.423-.28l-3.388-.93q-.397-.111-.794-.23-.397-.117-.794-.216v19.68l4.976-1.427q.26-.074.422-.28.161-.204.161-.477z" />
                              </svg>
                            </a>
                          </Link>
                          <Link href={"data:text/calendar," + eventLink()}>
                            <a
                              className="mx-2 h-10 w-10 rounded-sm border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:text-white"
                              download={props.eventType?.title + ".ics"}>
                              <svg
                                version="1.1"
                                fill="currentColor"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 1000 1000"
                                className="mr-1 -mt-1 inline-block h-4 w-4">
                                <title>{t("other")}</title>
                                <path d="M971.3,154.9c0-34.7-28.2-62.9-62.9-62.9H611.7c-1.3,0-2.6,0.1-3.9,0.2V10L28.7,87.3v823.4L607.8,990v-84.6c1.3,0.1,2.6,0.2,3.9,0.2h296.7c34.7,0,62.9-28.2,62.9-62.9V154.9z M607.8,636.1h44.6v-50.6h-44.6v-21.9h44.6v-50.6h-44.6v-92h277.9v230.2c0,3.8-3.1,7-7,7H607.8V636.1z M117.9,644.7l-50.6-2.4V397.5l50.6-2.2V644.7z M288.6,607.3c17.6,0.6,37.3-2.8,49.1-7.2l9.1,48c-11,5.1-35.6,9.9-66.9,8.3c-85.4-4.3-127.5-60.7-127.5-132.6c0-86.2,57.8-136.7,133.2-140.1c30.3-1.3,53.7,4,64.3,9.2l-12.2,48.9c-12.1-4.9-28.8-9.2-49.5-8.6c-45.3,1.2-79.5,30.1-79.5,87.4C208.8,572.2,237.8,605.7,288.6,607.3z M455.5,665.2c-32.4-1.6-63.7-11.3-79.1-20.5l12.6-50.7c16.8,9.1,42.9,18.5,70.4,19.4c30.1,1,46.3-10.7,46.3-29.3c0-17.8-14-28.1-48.8-40.6c-46.9-16.4-76.8-41.7-76.8-81.5c0-46.6,39.3-84.1,106.8-87.1c33.3-1.5,58.3,4.2,76.5,11.2l-15.4,53.3c-12.1-5.3-33.5-12.8-62.3-12c-28.3,0.8-41.9,13.6-41.9,28.1c0,17.8,16.1,25.5,53.6,39c52.9,18.5,78.4,45.3,78.4,86.4C575.6,629.7,536.2,669.2,455.5,665.2z M935.3,842.7c0,14.9-12.1,27-27,27H611.7c-1.3,0-2.6-0.2-3.9-0.4V686.2h270.9c19.2,0,34.9-15.6,34.9-34.9V398.4c0-19.2-15.6-34.9-34.9-34.9h-47.1v-32.3H808v32.3h-44.8v-32.3h-22.7v32.3h-43.3v-32.3h-22.7v32.3H628v-32.3h-20.2v-203c1.31.2,2.6-0.4,3.9-0.4h296.7c14.9,0,27,12.1,27,27L935.3,842.7L935.3,842.7z" />
                              </svg>
                            </a>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </>
    )) ||
    null
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const ssr = await ssrInit(context);

  console.log("FIND", context.query.uid);

  const bookingInfo = await prisma.booking.findUnique({
    where: {
      uid: asStringOrUndefined(context.query.uid),
    },
    select: {
      title: true,
      uid: true,
      description: true,
      customInputs: true,
      startTime: true,
      endTime: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          theme: true,
          brandColor: true,
          darkBrandColor: true,
          username: true,
        },
      },
      attendees: {
        select: {
          name: true,
          email: true,
        },
      },
      eventType: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          length: true,
          recurringEvent: true,
          locations: true,
          eventName: true,
          metadata: true,
          requiresConfirmation: true,
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  const eventType = bookingInfo?.eventType;

  const profile = {
    name: bookingInfo?.user?.name || null,
    email: bookingInfo?.user?.email || null,
    theme: bookingInfo?.user?.theme || null,
    brandColor: bookingInfo?.user?.brandColor || null,
    darkBrandColor: bookingInfo?.user?.darkBrandColor || null,
    slug: bookingInfo?.user?.username || null,
  };

  console.log("BOOKINGINFO", bookingInfo);

  return {
    props: {
      hideBranding: false,
      profile,
      eventType,
      recurringBookings: null,
      trpcState: ssr.dehydrate(),
      dynamicEventName: bookingInfo?.eventType?.title,
      userHasSpaceBooking: false,
      bookingInfo: bookingInfo, // (({ startTime, endTime, ...o }) => o)(bookingInfo),
      date: bookingInfo?.startTime.toString(),
    },
  };
}
