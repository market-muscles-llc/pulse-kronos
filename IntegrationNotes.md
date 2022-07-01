# Notes

- Node server is running
- ~~How to log in automatically? MAGIC LINK~~

## Kronos Needs
- Login
 - Set cookie/localStorage with tenant URL
- Logged-out page
 - Show "redirecting" message
 - Look for tenant URL in localStorage, redirect to MagicLink auto-route

### Webhooks
- ~~Booking created~~
- ~~Rescheduled~~
- ~~Cancelled~~
- Connected Calendar issues
 - Failed to complete oAuth
 - Insufficient permissions (need to check both boxes)
- Updated Username
- Updated Location
- Reschedule stuff

- Control should let Kronos know when Marketing Email changes

### App Store:
Seed app and credentials
`npm run -w @calcom/prisma seed-app-store`

## Laravel-side needs
- Connect to DB, postgres so thats cool
- Create accounts
- Log into Cal - MAGIC LINK
- Define a slug/prefix for calendars - CAL USERNAME

### What to do
- Create account in Kronos, set metadata about tenant
- Click on link, create magic link, go to it
 - Store cookie that says how long magic link should be assumed
- Accept route from Kronos that says they want a MagicLink, generate it and return.
- Models for Kronos Data
- Notifications
- Triggers
- Accept Webhooks:

#### Webhooks
- Booking created
- Rescheduled
- Cancelled
- Connected Calendar issues
 - Failed to complete oAuth
 - Insufficient permissions (need to check both boxes)

# Starting up
Configure .env
Configure .env.appStore
Configure packages/prisma/.env
`npm run build`
<!-- `npm run -w @calcom/prisma seed-app-store` -->

https://codeburst.io/how-to-deploy-a-nodejs-server-using-laravel-forge-a9a46dbdc761
