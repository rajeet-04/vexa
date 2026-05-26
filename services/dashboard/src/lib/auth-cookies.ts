/**
 * Auth cookie name helpers.
 *
 * Cookie names are configured at runtime via environment variables so that
 * multiple deployments (compose, lite, dev) can coexist in the same browser
 * without colliding.
 *
 *   VEXA_AUTH_COOKIE_NAME      — bearer token / API key cookie (default: "vexa-token")
 *   VEXA_USER_INFO_COOKIE_NAME — serialised user-info JSON cookie (default: "vexa-user-info")
 */

export function getAuthCookieName(): string {
  return process.env.VEXA_AUTH_COOKIE_NAME ?? "vexa-token";
}

export function getUserInfoCookieName(): string {
  return process.env.VEXA_USER_INFO_COOKIE_NAME ?? "vexa-user-info";
}
