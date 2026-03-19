import { CookieOptions, Response } from "express";
import { env } from "../config/env";
import { getTokenExpirySeconds } from "./jwt";

export const AUTH_COOKIE_NAMES = {
  accessToken: "accessToken",
  refreshToken: "refreshToken",
} as const;

type CookieSameSite = "lax" | "strict" | "none";

const resolveCookieSameSite = (): CookieSameSite => {
  if (
    env.COOKIE_SAME_SITE === "lax" ||
    env.COOKIE_SAME_SITE === "strict" ||
    env.COOKIE_SAME_SITE === "none"
  ) {
    return env.COOKIE_SAME_SITE;
  }

  return env.NODE_ENV === "production" ? "none" : "lax";
};

const resolveCookieSecure = () => {
  if (env.COOKIE_SECURE === "true") {
    return true;
  }

  if (env.COOKIE_SECURE === "false") {
    return false;
  }

  return env.NODE_ENV === "production";
};

const baseCookieOptions = (): CookieOptions => {
  const options: CookieOptions = {
    httpOnly: true,
    secure: resolveCookieSecure(),
    sameSite: resolveCookieSameSite(),
    path: "/",
  };

  if (env.COOKIE_DOMAIN) {
    options.domain = env.COOKIE_DOMAIN;
  }

  return options;
};

export const setAuthCookies = (
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
) => {
  const baseOptions = baseCookieOptions();

  res.cookie(AUTH_COOKIE_NAMES.accessToken, tokens.accessToken, {
    ...baseOptions,
    maxAge: getTokenExpirySeconds("access") * 1000,
  });

  res.cookie(AUTH_COOKIE_NAMES.refreshToken, tokens.refreshToken, {
    ...baseOptions,
    maxAge: getTokenExpirySeconds("refresh") * 1000,
  });
};

export const setAccessTokenCookie = (res: Response, accessToken: string) => {
  res.cookie(AUTH_COOKIE_NAMES.accessToken, accessToken, {
    ...baseCookieOptions(),
    maxAge: getTokenExpirySeconds("access") * 1000,
  });
};

export const clearAuthCookies = (res: Response) => {
  const baseOptions = baseCookieOptions();

  res.clearCookie(AUTH_COOKIE_NAMES.accessToken, baseOptions);
  res.clearCookie(AUTH_COOKIE_NAMES.refreshToken, baseOptions);
};
