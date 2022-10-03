/*
 * Detects navigator locale 24h time preference
 * It works by checking whether hour output contains AM ('1 AM' or '01 h')
 * based on the user's preferred language
 * defaults to 'en-US' (12h) if no navigator language is found
 */
import { localStorage } from "@calcom/lib/webstorage";

const is24hLocalstorageKey = "timeOption.is24hClock";

export const setIs24hClockInLocalStorage = (is24h: boolean) =>
  localStorage.setItem(is24hLocalstorageKey, is24h.toString());

export const getIs24hClockFromLocalStorage = () => {
  const is24hFromLocalstorage = localStorage.getItem(is24hLocalstorageKey);
  if (is24hFromLocalstorage === null) return null;

  return is24hFromLocalstorage === "true";
};

export const isBrowserLocale24h = () => {
  const localStorageTimeFormat = getIs24hClockFromLocalStorage();
  // If time format is already stored in the browser then retrieve and return early
  if (localStorageTimeFormat === true) {
    return true;
  } else if (localStorageTimeFormat === false) {
    return false;
  }

  let locale = "en-US";
  if (typeof window !== "undefined" && navigator) locale = window.navigator?.language;

  if (new Intl.DateTimeFormat(locale, { hour: "numeric" }).format(0).match(/M/)) {
    setIs24hClockInLocalStorage(false);
    return false;
  } else {
    setIs24hClockInLocalStorage(true);
    return true;
  }
};

export const detectBrowserTimeFormat = isBrowserLocale24h() ? "H:mm" : "h:mma";
