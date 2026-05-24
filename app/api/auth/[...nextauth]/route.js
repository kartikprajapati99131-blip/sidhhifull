import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import FacebookProvider from "next-auth/providers/facebook"
import CredentialsProvider from "next-auth/providers/credentials"
import connectDb from "@/db/connectDb"
import User from "@/models/user"
import bcrypt from "bcryptjs";

// ✅ EXPORT THIS
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectDb();

        const email = credentials.email.toLowerCase().trim();

        const user = await User.findOne({ email });

        // ✅ check user exists
        if (!user) {
          throw new Error("User not found");
        }

        // ✅ compare password securely
        const isMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isMatch) {
          throw new Error("Invalid password");
        }

        // ✅ return safe user object (IMPORTANT)
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        };
      },
    })
  ],

callbacks: {
    async signIn({ user, account }) {
    if (!user.email) return false;

    if (
      account.provider === "google" ||
      account.provider === "github" ||
      account.provider === "facebook"

    ) {
      await connectDb();

      const currentUser = await User.findOne({ email: user.email });
      const usernameBase = (user.name || user.email.split("@")[0])
        .replace(/[^a-zA-Z]/g, "");

      const username =
        usernameBase + Math.floor(Math.random() * 1000);

      if (!currentUser) {
        const newUser = await User.create({
          email: user.email,
          username: username,
          name: user.name || usernameBase,
          profilepic: user.image,
        });

        user.name = newUser.username;
      } else {
        user.name = currentUser.username;
      }
    }

    return true;
  },
    async jwt({ token, user }) {
  await connectDb();

  const email = user?.email || token.email;
  const dbUser = await User.findOne({ email });

  if (dbUser) {
    token.id = dbUser._id.toString();
    token.role = dbUser.role;
  }

  return token;
},

    async session({ session, token }) {
    session.user.id = token.id; // ✅ REQUIRED
    session.user.role = token.role;
    return session;
  },
},

};

// ✅ USE IT HERE
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };