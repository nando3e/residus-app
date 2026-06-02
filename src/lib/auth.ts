import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        usuari: { label: "Usuari", type: "text" },
        password: { label: "Contrasenya", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.usuari || !credentials?.password) return null;

        const usuari = credentials.usuari as string;
        const password = credentials.password as string;

        // Superadmin from env
        if (
          usuari === process.env.SUPERADMIN_USER &&
          password === process.env.SUPERADMIN_PASS
        ) {
          return {
            id: "superadmin",
            name: "Administrador",
            usuari: process.env.SUPERADMIN_USER!,
            rol: "superadmin",
          };
        }

        const user = await prisma.user.findUnique({ where: { usuari } });
        if (!user || !user.actiu) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.nom,
          usuari: user.usuari,
          rol: user.rol,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.usuari = (user as any).usuari;
        token.rol = (user as any).rol;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).usuari = token.usuari;
        (session.user as any).rol = token.rol;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
});
