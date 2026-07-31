import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from ".."; // your drizzle instance
import * as schema from "../db/schema"
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL, 
    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite"
        schema: schema
    }),
    plugins: [nextCookies()],
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
});