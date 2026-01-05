import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// 🔹 Définir authOptions séparément
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  cookies: {
    sessionToken: {
      name: "__Secure-next-auth.session-token-project2",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },

  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
};

export default NextAuth(authOptions);
