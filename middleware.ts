import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);
const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;
    const isPrivate = /\/admin|\/portal\/tickets/.test(nextUrl.pathname);

    if (isPrivate && !isLoggedIn) {
        const newUrl = new URL("/login", nextUrl.origin);
        newUrl.searchParams.set("callbackUrl", nextUrl.href);
        return NextResponse.redirect(newUrl);
    }

    return intlMiddleware(req as unknown as NextRequest);
})

export const config = {
    // Matcher: Exclude api, static, image, favicon, manifest, workers, images, and uploads
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*|uploads|.*\\.png$).*)']
};
