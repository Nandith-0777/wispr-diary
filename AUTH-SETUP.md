# Turn on email sign-in and account books

The website code is ready, but live login and cloud saving stay disabled until your Supabase project is connected. You do not need to write code. The public sample works without signing in.

## 1. Create your project

Open https://supabase.com/dashboard, sign up or sign in, then choose **New project**. Choose your organization, name it **Wispr Diary**, set a database password, and choose a region near your users. Keep the database password private. Wait for project creation to finish.

## 2. Create the private book storage

Open **SQL Editor** in that project, choose **New query**, paste the entire contents of `supabase/schema.sql` from this folder, and click **Run**. This creates the book table and policies that let an authenticated user access only their own library. The script can be run again safely.

## 3. Enable email sign-in

In **Authentication**, find **Sign In / Providers** and make sure **Email** and new-user signups are enabled. The app uses passwordless email sign-in: a sign-in link or a code, rather than an email password.

Open **Email Templates**, then **Magic Link**. Include this in the template so the email contains a code the user can enter on the website:

```html
<h2>Sign in to Wispr Diary</h2>
<p>Your sign-in code is: {{ .Token }}</p>
<p><a href="{{ .ConfirmationURL }}">Or sign in with this link</a></p>
```

Do not type a fixed number in place of the Token template. Supabase generates the code. Entering the code in the same browser that requested it is the simplest local test.

## 4. Allow your website address

Under **Authentication > URL Configuration**, set **Site URL** to `http://127.0.0.1:4173/` and add that same address under **Redirect URLs**. If you use `http://localhost:4173/`, add that address too. After deployment, set Site URL to the real HTTPS website and allow its redirect address.

## 5. Connect the website

Find your **Project URL** and **publishable key** in the project Connect dialog or Settings / API Keys. Edit `dist/auth-config.json`:

```json
{
  "supabaseUrl": "https://YOUR-PROJECT.supabase.co",
  "publishableKey": "YOUR-PUBLISHABLE-KEY"
}
```

These two values are public browser configuration. Never put a secret key, service-role key, database password, or email-service password in this file or in chat. If you prefer, share only the Project URL and publishable key and I can connect them in the local project.

## 6. Test your first book

Start the website with `Start Diary.cmd` if it is not running, refresh, and click **Make your own book**. Enter your email, request a sign-in email, enter its code, then choose your book title, category, cover color/style, optional subtitle/name, and optional cover image. A new empty book opens. Make another book to test the library.

Sign out and back in to check both books return. Test a second account and verify it cannot see the first account's books. Test a second browser after cloud saving finishes. Verify real email delivery and account isolation before inviting visitors.

## Sending email to visitors

Supabase's default email sender is for testing and sends only to pre-authorized project-team addresses. For public visitors, configure **custom SMTP** with an email provider and a verified sender domain in Supabase Authentication. Keep those SMTP credentials in Supabase, never in the website. See https://supabase.com/docs/guides/auth/auth-smtp.

## How saving works

Each account has one versioned library protected by row-level security. The sample is generated locally and excluded from cloud uploads. Guest books are imported only through the explicit account import button. Saves are version checked; concurrent changes pause sync and offer recovery choices. Unsynced changes are kept in this browser. Media is currently included in the library JSON under the existing small-file limits; large uploads need object storage later. The AI voice API key is a separate setup and is not enabled by configuring Supabase.

Official references: https://supabase.com/docs/guides/auth/auth-email-passwordless and https://supabase.com/docs/guides/database/postgres/row-level-security.

## Google sign-in

Google OAuth is connected and a real owner-account sign-in and refresh were verified on 30 October 2026. Email and Google sessions both restore the account library. Google remains in Testing mode; see GOOGLE-SIGNIN-SETUP.md for the current setup and public-launch requirements.
