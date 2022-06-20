/*
 * Detects navigator locale 24h time preference
 * It works by checking whether hour output contains AM ('1 AM' or '01 h')
 * based on the user's preferred language
 * defaults to 'en-US' (12h) if no navigator language is found
 */
export const isBrowserLocale24h = () => {
  let locale = "en-US";
  const date = new Date();
  date.setHours(0, 0, 0);
  if (typeof window !== "undefined" && navigator) locale = navigator?.language;
  return !new Intl.DateTimeFormat(locale, { hour: "numeric" }).format(date).match(/AM/);
};
export const detectBrowserTimeFormat = isBrowserLocale24h() ? "H:mm" : "h:mma";
