import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { serverClient } from "@/lib/sanity";
import { MEMBER_BY_EMAIL_QUERY } from "@/lib/queries";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).trim().toLowerCase();
        const member = await serverClient.fetch<{
          _id: string;
          fullName: string;
          email: string;
          passwordHash: string;
          role: string;
        } | null>(MEMBER_BY_EMAIL_QUERY, { email });
        if (!member?.passwordHash) return null;
        const ok = await bcrypt.compare(
          String(credentials.password),
          member.passwordHash
        );
        if (!ok) return null;
        return {
          id: member._id,
          email: member.email,
          name: member.fullName,
          role: member.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.sub = (user as { id: string }).id;
        (token as { role?: string }).role = (user as { role?: string }).role;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        (session.user as { id?: string }).id = token.sub ?? "";
        (session.user as { role?: string }).role = (token as { role?: string })
          .role as string;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
});
