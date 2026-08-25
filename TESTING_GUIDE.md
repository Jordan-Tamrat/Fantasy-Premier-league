# Testing Guide — Fantasy Money League

A complete manual test checklist for the deployed app. Organized so you can
go through it in order: what's different between Admin and Member, how to
actually onboard your friends and link their FPL accounts, then a
feature-by-feature checklist for each role, then a full end-to-end run.

> **Heads up before you start:** your Vercel deployment and your local dev
> environment currently point at the **same Supabase database**. That means
> the demo seed data (a fake admin, 8 fake members, a fake completed Game
> Week 1) already exists on the live site right now, and anything you test
> locally or in production affects the same real data. Fine for now while
> you're the only one testing — just don't invite real friends until you've
> decided whether to keep sharing one database or split dev from prod.

---

## 1. Admin vs Member — what's actually different

| Area | Member can | Admin can (in addition) |
|---|---|---|
| Game Weeks | View status, pool, prizes, deadlines, results, submit their own payment | Create, configure, open/close/lock/finalize, set prize amounts, cancel |
| Payments | Submit their own payment + screenshot, see their own status | Verify/reject **anyone's** payment, view proof screenshots |
| Prizes | See who won what, see paid/pending status | Mark a prize as paid, upload payout proof |
| FPL scores | — | Manually trigger sync, manually enter a score with a reason if FPL data is missing |
| Leaderboard/History | View both (read-only) | Same, no admin-only view |
| Chat | Send, reply, attach images, delete **their own** messages | Delete **anyone's** message, pin/unpin messages |
| Announcements | View | Create, delete |
| Rules | View | Add/edit/delete rule sections |
| Proposals | Create a proposal, vote once (can change their vote) | Same, plus "Tally votes now" (only after deadline) and "Mark implemented" |
| Disputes | Raise one, see admin's response | See and respond to **everyone's** disputes |
| Members | — | Change anyone's role (member ↔ admin), disable/enable an account |
| Invites | — | Create/revoke invite links |
| Audit log | — | View every admin action ever taken, with old/new values |
| FPL sync monitor | — | See sync status, trigger a sync manually |
| League settings | — | Change league name, currency, default entry fee/deadlines, official Telebirr/CBE numbers |
| Profile | Everyone (member or admin) can edit their own picture, payment methods, FPL link |

The short version: **admins get an extra sidebar section and can act on other
people's stuff** (verify payments, respond to disputes, moderate chat).
Everything else is identical between the two roles — same dashboard, same
Game Week pages, same chat.

---

## 2. Onboarding a real friend, end to end

This is the actual flow — no email is sent, you share a link by hand.

### As admin: create the invite
1. Log in as admin → sidebar → **Invites**.
2. Enter their email, choose role (**Member** for basically everyone; **Admin**
   only if you want a co-admin).
3. Click **Create invite**. A link appears on the page in the form
   `https://your-app.vercel.app/invite/{token}`.
4. Copy that link and send it to them however you'd normally message them
   (WhatsApp, Telegram, SMS — there's no built-in email).
5. You can **Revoke** an invite from the same page if you sent it to the
   wrong person or they never used it.

### As your friend: accept the invite
1. They open the link on their phone or laptop.
2. They see "Join the league" with their email already shown.
3. They enter their name and choose a password (min 8 characters).
4. Submitting creates their account and logs them straight in to `/dashboard`.

### As your friend: link their FPL team
1. Sidebar → **Profile**.
2. Under "FPL team," enter their **FPL entry ID** — this is just a number.
   To find it: they open their team on the official FPL site, click
   **"Points"**, and look at the URL —
   `https://fantasy.premierleague.com/entry/1234567/event/5` — the number
   right after `/entry/` (`1234567` here) is their entry ID.
3. Click **Link**. The app calls the real FPL API and shows their team name
   and manager name if the ID is valid — no FPL password is ever asked for
   or stored, only that public ID.
4. They can **Unlink** any time and re-link a different ID.

That's the whole onboarding loop. Repeat the invite step per friend.

---

## 3. Admin checklist

Go through these roughly in the order a real Game Week happens.

### League settings (do this once, first)
- [ ] `/admin/settings` — set league name, currency, default entry fee,
      default payment-deadline offset, default minimum participants
- [ ] Set your real **Telebirr** and/or **CBE** number and the account name
      — this is what members will see when they go to pay

### Creating and running a Game Week — `/admin/gameweeks`
- [ ] **Create Game Week** — pick the FPL Game Week number, entry fee, min
      participants, payment deadline offset; announcement text is optional
- [ ] Open the new Game Week → confirm the FPL deadline was pulled correctly
      from the real FPL API
- [ ] Click **Open for payment** — status changes to `OPEN`
- [ ] **Prizes tab** — set amounts for 1st/2nd/3rd; try entering a total that
      exceeds what's been collected so far and confirm it's rejected
- [ ] **Payments tab** — once a member has submitted a payment, click
      **View proof** to see the screenshot, then **Verify** or **Reject**
      (try Reject with a reason, confirm the member sees it and can
      resubmit)
- [ ] Click **Close payments** — status changes to `PAYMENT_CLOSED`
- [ ] Click **Lock Game Week** — confirm the participant count and pool
      match verified payments only, not everyone who registered
- [ ] Test the **Cancel Game Week** button on a *different* test Game Week
      with too few verified participants — confirm it requires a reason
      and the money trail (collected amount) is still recorded

### FPL scores and finalizing
- [ ] `/admin/fpl-sync` — check the current FPL Game Week/deadline shown,
      and try **Sync now** on the active Game Week
- [ ] Back in the Game Week's **Results tab**: if any participant shows
      "⚠ Missing FPL data," try both **Retry sync** and entering a score
      manually with a reason
- [ ] Click **Finalize results** — confirm ranks, ties, and prize splits
      look right (this is the one place to genuinely trust the math, but
      worth eyeballing against the leaderboard)
- [ ] **Mark a prize as paid** — choose method, add a reference number,
      upload a payout screenshot — confirm the member sees "Paid" and the
      Game Week auto-completes once every prize is marked paid

### Everything else
- [ ] `/admin/members` — toggle a test account's role (Make admin / Make
      member) and status (Disable / Enable), confirm a disabled account
      can't log in
- [ ] `/admin/announcements` — post one, confirm it shows up in the member
      announcements list *and* in chat as a system message *and* as a
      notification for every member
- [ ] `/admin/rules` — add a section, edit it, delete it
- [ ] `/admin/disputes` — respond to a dispute a member raised (see §4),
      change its status, confirm the member sees your response
- [ ] `/admin/audit-log` — confirm your actions above (verify, lock,
      finalize, role change, rule edit) all show up with old/new values
- [ ] Proposals: after a friend creates one and votes are in, once the
      deadline passes, try **Tally votes now** on `/proposals`; after it
      passes, try **Mark implemented**
- [ ] Chat: pin a message, unpin it, delete someone *else's* message
      (confirm it shows "Message deleted" and is in the audit log)

---

## 4. Member checklist

Do this logged in as a non-admin account (or ask a friend to).

- [ ] `/dashboard` — confirm current Game Week, countdown, payment status,
      and the latest announcement all show correctly
- [ ] `/gameweeks` → open one → **submit a payment**: pick Telebirr or CBE,
      attach a screenshot, submit; confirm status shows "Under review"
- [ ] After admin rejects it, confirm you can resubmit; after admin
      verifies it, confirm it shows "Verified"
- [ ] `/leaderboard` — confirm it's ranked by net winnings, not weekly points
- [ ] `/history` — confirm your personal stats (participated/wins/top-3/net)
      and the list of past Game Weeks
- [ ] `/profile` — upload a profile picture (tap the avatar), edit Telebirr/
      CBE numbers, link/unlink your FPL account
- [ ] `/chat` — send a message, reply to one, attach an image, delete your
      own message, scroll up and click **Load older messages**
- [ ] `/announcements` — confirm you see admin posts (read-only)
- [ ] `/rules` — confirm you see the current rules (read-only)
- [ ] `/proposals` — create one with a future voting deadline, vote Yes,
      change your vote to No, confirm you can't vote twice as two separate
      votes
- [ ] `/disputes` — raise one with a category, title, and description;
      confirm you see the admin's response once they reply
- [ ] `/notifications` — confirm the bell badge count matches unread items,
      click one to jump to the relevant page, try **Mark all read**

---

## 5. Full end-to-end run (do this last)

The real weekly cycle, start to finish, using two browser sessions (or one
normal + one incognito) so you're admin in one and a member in the other:

1. **Admin**: create a Game Week, set prizes, open for payment.
2. **Member**: submit a payment.
3. **Admin**: verify it.
4. **Admin**: close payments, then lock — confirm the member now sees
   "Locked" and the participant snapshot is right.
5. **Admin**: sync FPL scores (or enter one manually).
6. **Admin**: finalize results — confirm the member's dashboard/leaderboard
   update to reflect the outcome.
7. **Admin**: mark the prize paid.
8. **Both**: check `/chat` — confirm the system posted messages for "locked"
   and "results are final" automatically, and that a notification landed
   for both accounts at each step.

If all eight steps line up without you needing to refresh anything by hand,
the core loop is solid.
