import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { getPrisma } from './prisma';
import { AdminRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = getPrisma();

export const authOptions: NextAuthOptions = {
  adapter: prisma ? PrismaAdapter(prisma) : undefined,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !prisma) {
          return null;
        }

        try {
          const adminUser = await prisma.adminUser.findUnique({
            where: {
              email: credentials.email,
            },
          });

          if (!adminUser) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            adminUser.password
          );

          if (!isPasswordValid) {
            return null;
          }

          // Check if user is active
          if (!adminUser.isActive) {
            return null;
          }

          return {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            role: adminUser.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist the user ID and role to the token right after signin
      if (user) {
        token.id = user.id;
        token.role = user.role as AdminRole;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as AdminRole;
      }
      return session;
    },
  },
};
