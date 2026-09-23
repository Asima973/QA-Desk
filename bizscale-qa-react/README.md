# BizScale QA Desk (React)

QA dashboard for Content, Graphics, GMB, SEO On-page, SEO Off-page and Web Dev.

## Run it

```bash
npm install
npm run dev      # local dev at http://localhost:5173
npm run build    # production build in /dist (upload to any static host)
```

## Structure

```
src/
  main.jsx              entry
  App.jsx               layout + hash routing (#overview, #content, #gmb, #mine, #team …)
  QaContext.jsx         app state, actions (start / mark fixed / reopen / notify / reassign)
  styles.css            design tokens (light + dark) and all styles
  lib/constants.js      departments, mistake types, severities
  lib/utils.js          metrics, time helpers, Google Chat message builder
  lib/store.js          data layer (localStorage by default) + sample data
  components/           Sidebar, KPI strip, charts, issue list, drawers, icons
  views/Views.jsx       Overview, Department, My issues, Team roster pages
```

## Sharing data across the team

`src/lib/store.js` saves to the browser's localStorage, so each person only sees
their own browser's data. To give the whole team one live board, replace the
functions in that file (`subscribe`, `saveIssue`, `patchIssue`, `saveMember`,
`deleteMember`, `clearSamples`) with Firebase Firestore or Supabase calls that
keep the same signatures. `subscribe` should push `{ issues, members }` to its
callback whenever the data changes (e.g. Firestore `onSnapshot`). Nothing else
needs to change.

## Google Chat

"Notify" builds a ready-to-send message (issue, URL, severity, @mention when a work
email is set) and opens the person's Chat link from Team roster. Fully automatic
sending needs a small backend (e.g. a Firebase Cloud Function that posts to a
Google Chat incoming webhook when an issue is created).
