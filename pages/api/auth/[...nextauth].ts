import NextAuth, { type NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const options: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || process.env.NEXT_AUTH_SECRET,
  providers: [
    Credentials({
      name: 'HTTP',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // You can replace this with your own authentication logic
        if (
          credentials?.username === (process.env.ADMIN_USERNAME || 'admin') &&
          credentials?.password === (process.env.ADMIN_PASSWORD || 'password')
        ) {
          return { id: '1', name: credentials.username };
        } else {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/coolkidsonly',
  },
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token from a provider.
      (session as typeof session & { accessToken?: unknown }).accessToken = token.accessToken;
      return session;
    },
  },
};

export default NextAuth(options);
