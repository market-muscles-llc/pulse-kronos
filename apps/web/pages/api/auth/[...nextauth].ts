import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { UserPermissionRole } from "@prisma/client";
import NextAuth, { Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";

import { WEBSITE_URL } from "@calcom/lib/constants";
import { defaultCookies } from "@calcom/lib/default-cookies";

import { ErrorCode, verifyPassword } from "@lib/auth";
import prisma from "@lib/prisma";

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export default NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  theme: {
    colorScheme: "light",
  },
  // pages: {
  //   signIn: "/auth/login",
  //   signOut: "/auth/logout",
  //   error: "/auth/error", // Error code passed in query string as ?error=
  // },
  cookies: defaultCookies(WEBSITE_URL?.startsWith("https://")),
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
    CredentialsProvider({
      id: "credentials",
      name: "PulseAppt.com",
      type: "credentials",
      credentials: {
        email: { label: "Email Address", type: "email", placeholder: "john.doe@example.com" },
        password: { label: "Password", type: "password", placeholder: "Your super secure password" },
      },
      async authorize(credentials) {
        if (!credentials) {
          console.error(`For some reason credentials are missing`);
          throw new Error(ErrorCode.InternalServerError);
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email.toLowerCase(),
          },
        });

        if (!user) {
          throw new Error(ErrorCode.UserNotFound);
        }

        if (!user.password) {
          throw new Error(ErrorCode.UserMissingPassword);
        }

        const isCorrectPassword = await verifyPassword(credentials.password, user.password);
        if (!isCorrectPassword) {
          throw new Error(ErrorCode.IncorrectPassword);
        }

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn(params) {
      const { account, email } = params;

      if (account.provider === "email") {
        return true;
      }
      // In this case we've already verified the credentials in the authorize
      // callback so we can sign the user in.
      if (account.type === "credentials") {
        return true;
      }

      return true;
    },
    async jwt({ token }) {
      const existingUser = await prisma.user.findFirst({
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        where: { email: token.email! },
      });

      if (!existingUser) {
        return token;
      }

      return {
        id: existingUser.id,
        username: existingUser.username,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        impersonatedByUID: token?.impersonatedByUID as number,
      };
    },
    async session({ session, token }) {
      const hasValidLicense = true;
      const calendsoSession: Session = {
        ...session,
        hasValidLicense,
        user: {
          ...session.user,
          id: token.id as number,
          name: token.name,
          username: token.username as string,
          role: token.role as UserPermissionRole,
          impersonatedByUID: token.impersonatedByUID as number,
        },
      };
      return calendsoSession;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === new URL(baseUrl || WEBSITE_URL).origin) return url;
      return baseUrl;
    },
  },
});
