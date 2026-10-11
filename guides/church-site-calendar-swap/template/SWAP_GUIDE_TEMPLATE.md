# Swapping in the new website for {{ORG_NAME}}

This guide is for the office and whoever manages the domain name. It takes about one afternoon. The old website stays up until the new one is ready, so nobody loses the site during the change.

**Before you start:** pick one person to lead. Find the logins for (a) the current website, (b) the domain name ({{DOMAIN}}), and (c) the Google account that owns the church calendar ({{CALENDAR_ACCOUNT}}).

---

## Step 1. Check what the current site already uses (15 minutes)

1. Open {{CURRENT_SITE_URL}} in a browser.
2. Find the calendar page. If it links to a Google Calendar, write down the account name shown at the top of that calendar. That is the calendar to reuse.
3. Check that you can sign in to that account. If you cannot, stop and ask whoever set up the website before going on.
4. Write down where the current website is hosted. Look in the email for "welcome" messages from the website provider.

## Step 2. Set up the new site on Google Sites (about 1 hour)

Google Sites is free with a Google account. Button names may differ slightly from this guide. Read the labels on the screen.

1. Go to **sites.google.com** and sign in with the church account.
2. Click **+ Blank** to start a new site. Name it "{{NEW_SITE_NAME}}".
3. Add a page for each main section, such as About, Calendar, Sundays, Ministries, Give, and Visit.
4. Copy the text and photos from the demo into those pages. Only use photos the church owns or has permission to use.
5. Before you publish, check every detail: names, phone numbers, email addresses, and service times. Old sites often have out-of-date copies of these.

## Step 3. Connect the church calendar (10 minutes)

After this, anyone who adds an event to the church Google Calendar will see it on the website.

1. In Google Calendar, find the church calendar in the list on the left. Click the three dots beside it, then **Settings and sharing**.
2. Under **Access permissions**, tick **Make available to public**. Without this, the website shows an empty box.
3. Under **Integrate calendar**, copy the **Calendar ID**. It looks like an email address.
4. In Google Sites, use **Insert > Embed**, then paste this code. Replace `CALENDAR_ID` with your ID. If the ID contains an @ sign, write `%40` instead:

```html
<iframe src="https://calendar.google.com/calendar/embed?src=CALENDAR_ID&ctz={{TIME_ZONE}}"
  style="border:0" width="100%" height="600" frameborder="0" scrolling="no"></iframe>
```

5. Click the preview (eye) icon. Check that events appear.

Current calendar ID in use: `{{CALENDAR_ID}}`

**Staff add events here:** open Google Calendar, click **Create**, fill in the title, date, time, and place, then click **Save**. Events appear on the website within a few minutes.

## Step 4. Check the links that must keep working

Do not remove any link until you have confirmed it works on the new site. Keep a table like this one, and fill in each row from the old site:

| Link | Current address | What it is for |
|---|---|---|
| Giving | (fill in) | Check where the giving service is hosted. Use its address, not a page on the old site, if it is separate. |
| Livestream | (fill in) | Check where the stream is hosted. |
| Sermon archive | (fill in) | Keep working, or move the videos first. |
| Bulletin or documents | (fill in) | Download each file and host a copy on the new site before the old site closes. |

## Step 5. Move the domain (do this last, with help)

The domain is {{DOMAIN}}. Changing it means changing settings at the company that sells the domain, called the registrar.

1. In Google Sites, click **Settings > Custom domains**, then **Add a custom domain**. Enter {{DOMAIN}}.
2. Google will show you a record to add. Copy the exact text it shows.
3. Sign in to the registrar and add that record. Ask the person who manages the domain if you are not sure.
4. Wait up to 48 hours. Check the site from a phone on mobile data, not Wi-Fi, to see the real result.

**If something goes wrong:** remove the new record at the registrar. The old website comes back once the change takes effect.

**Keep the old site paid up until the new one works.** Do not cancel it until you have checked everything.

## Step 6. Tell people

- Post a short note in the bulletin and on social media.
- Update any listings, such as Google Business and Yelp, that show different hours or phone numbers.

## Optional: keep a custom-designed site

Google Sites cannot run custom animations, interactive pages, or custom fonts. If the church wants those, publish the site's files on a free static host, such as GitHub Pages or Netlify, then link to that address from Google Sites with **Insert > Embed**. Ask the person who builds the site to do this. Check the host's free terms before you start.

## Getting help

Contact {{CONTACT_EMAIL}}. Keep this guide with the rest of the site's files, so whoever picks this up later has the full history.
