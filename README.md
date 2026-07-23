# YourTube 2.0

YourTube is the existing training project extended with all six ElevanceSkills
internship assignments. It uses Next.js, React, Tailwind CSS, Express,
MongoDB, Firebase Authentication, Razorpay, Socket.IO and WebRTC.

## Training project continuity

This internship submission is built directly on the YouTube training source
provided during the ElevanceSkills training phase:
https://github.com/BitHeadmr/you_tube2.0

All internship assignments are integrated as additional features in that same
application and are not implemented as a separate project.

## Internship features

1. Multilingual comments
   - Comments accept Unicode letters from any language.
   - Symbols and special characters are rejected on both client and server.
   - Every comment shows the verified user's city.
   - Users can translate a comment into a selected language.
   - Users can like or dislike comments, but cannot react to their own.
   - A comment is deleted server-side after two dislikes from other users.
2. Downloads and premium access
   - Authenticated users can download videos.
   - Free users receive one download per IST calendar day.
   - Bronze, Silver and Gold users receive unlimited downloads.
   - Download history is available from the profile menu and `/downloads`.
3. Paid viewing plans
   - Free: 5 minutes per video.
   - Bronze (₹10): 7 minutes per video.
   - Silver (₹50): 10 minutes per video.
   - Gold (₹100): unlimited viewing.
   - Razorpay Standard Checkout uses server-created orders and server-side
     signature verification.
   - A successful payment updates the plan and emails a PDF invoice.
4. Location-aware login and theme
   - Browser geolocation is reverse-geocoded to city and state.
   - A manual exact-city fallback is shown if permission is unavailable.
   - Southern-state users verify by email OTP.
   - Other users verify by mobile OTP.
   - South India between 10:00 and 12:00 IST uses the light theme; every
     other location/time uses the dark theme.
5. Gesture video player
   - Double tap left/right: seek backward/forward 10 seconds.
   - Single tap center: play or pause.
   - Triple tap center: play the next video.
   - Triple tap left: open comments.
   - Triple tap right: request tab close, with a safe exit-page fallback
     because browsers cannot close tabs they did not open.
6. WebRTC video calls
   - Invite-link room calls with camera and microphone controls.
   - Socket.IO signaling.
   - Browser-tab screen sharing for a user-selected YouTube tab.
   - Local call recording and automatic WebM download.

## Local setup

### Backend

```bash
cd server
cp .env.example .env
npm ci
npm run dev
```

### Frontend

```bash
cd yourtube
cp .env.example .env.local
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Required external configuration

- MongoDB Atlas connection string
- Firebase web configuration and service-account JSON
- SMTP account for email OTP and invoice delivery
- Twilio credentials and sender number for mobile OTP
- Razorpay test-mode key ID and key secret

Never commit these values. Configure them in local environment files and
deployment dashboards.

## Verification

```bash
cd server
npm test

cd ../yourtube
npm run build
```

## Deployment

- Deploy `yourtube` to Vercel and set all `NEXT_PUBLIC_*` variables.
- Deploy `server` as the Render service defined in `render.yaml`.
- Set the backend `CLIENT_URL` to the Vercel URL.
- Set the frontend `NEXT_PUBLIC_BACKEND_URL` to the Render URL.
- Add the Vercel domain to Firebase Authentication's authorized domains.
- Use Razorpay test keys until evaluation is complete.

Camera, microphone, geolocation and screen sharing require HTTPS in
production. Screen sharing always requires the user to choose the tab or
window through the browser's protected picker.
