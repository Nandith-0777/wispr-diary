# Activate Google sign-in for Wispr Diary

Google sign-in was connected and tested on 30 October 2026. The OAuth client “Wispr Diary Web” is in Google Cloud project whispr-509513. Its private client secret is stored in the Supabase Google provider configuration, not in the website or local source files. The Google provider is enabled in Supabase project ilcdfmivsbmrizmxqzzt.

A real Google sign-in returned to the local website and restored the existing personal book from the account library. A page refresh also restored the signed-in session and book library.

The Google app is still in Testing mode. The approved owner account is on its test-user list. Public visitors cannot use this OAuth client until they are allowed as test users or the app completes its public publishing setup. The current allowed website addresses are http://127.0.0.1:4173/ and http://localhost:4173/. Deployment will need the real HTTPS website origin and redirect address. Email and Google sessions use the same account-library code after Supabase verifies the session.

The sections below document the setup for future maintenance.

## Google Cloud setup

1. Open https://console.cloud.google.com/ and select or create the Google Cloud project you own for Wispr Diary.
2. In Google Auth Platform, configure the app branding and audience. If the app is in Testing mode, add the Google accounts you want to use under Test users.
3. Create an OAuth client with application type Web application. Add your website origin under Authorized JavaScript origins (http://localhost:4173 for local development, plus the real HTTPS origin after deployment). For the Supabase redirect flow, add this exact Authorized redirect URI:

       https://ilcdfmivsbmrizmxqzzt.supabase.co/auth/v1/callback

4. Copy the Client ID and Client Secret. Keep the secret private; enter it only in the Supabase dashboard, never in the website files or chat.

## Supabase setup

1. Open your project > Authentication > Sign In / Providers > Google.
2. Enable Google and enter the Google Client ID and Client Secret. Save the provider settings. Confirm the callback URL shown there matches the Google redirect URI above.
3. In Authentication > URL Configuration, allow http://127.0.0.1:4173/ as Site URL and Redirect URL for local testing. Add http://localhost:4173/ too if you use it. For deployment, use the real HTTPS site URL.
4. Refresh Wispr Diary. Continue with Google becomes available once the provider settings report Google enabled.

## What sign-in should do

After Google returns a verified Supabase session, Wispr Diary loads the entire library for that account. It shows My Books unless the user was in the process of creating a new book, in which case the title/cover form resumes. Books, pages, media and unplaced ideas are saved in the same private versioned account library. A different Supabase user ID has a separate library. Use the same account to return to your books.

Test by signing in, creating two books, waiting for Saved to account, signing out, and signing in with that same Google account in another browser. Both books should return. Check that a second account cannot see them. Local tests mock Google OAuth and cloud storage; a real Google round trip is still required after dashboard activation. The SQL script in supabase/schema.sql must already be installed.

Official instructions: https://supabase.com/docs/guides/auth/social-sign-in/auth-google
