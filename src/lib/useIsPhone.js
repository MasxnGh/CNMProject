import { useEffect, useState } from "react";

/** Keep in step with the max-width media queries in the page CSS. */
export const PHONE_QUERY = "(max-width: 619px)";

/**
 * Components that size artwork pass a pixel number to <Illustration>, which
 * writes it to inline styles — a CSS media query can't reach that, so the
 * breakpoint has to be read in JS. Everything that is purely CSS should still
 * be done with a media query rather than this hook.
 */
export function useIsPhone() {
  const [isPhone, setIsPhone] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(PHONE_QUERY).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(PHONE_QUERY);
    const onChange = (e) => setIsPhone(e.matches);
    setIsPhone(mq.matches); // catch a resize that landed before this ran
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isPhone;
}
