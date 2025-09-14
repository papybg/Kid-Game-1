Deploy backend to Render (quick guide)

1. Create an account at https://render.com (free tier available).
2. Create a new Web Service -> Connect to GitHub and select this repository (papybg/Kid-Game-1).
3. Set the branch to `main` and the Root Directory to `.`.
4. Build Command: `npm run build`
5. Start Command: `npm run start`
6. Environment: Node
7. Instance type: free / starter
8. Add Environment Variable `ALLOWED_ORIGINS` and set it to the domains you need, for example:
   - `https://68c660dbd95386e3f66487fb--kid-game-1.netlify.app`
   - `http://localhost:5173`

9. Enable Auto-Deploy from the selected branch.
10. After render finishes provision and first deploy, copy the service URL (e.g. `https://kidgame-backend.onrender.com`).

Update Netlify:
1. Go to your Netlify site -> Site settings -> Build & deploy -> Environment.
2. Set `VITE_API_BASE` to the Render service URL (e.g. `https://kidgame-backend.onrender.com`).
3. Trigger a Deploy in Netlify (Clear cache & deploy) or push a small change to the repo.

Notes:
- Render will use `PORT` env variable provided by the platform. The server reads `process.env.PORT` so no changes are necessary.
- If you want automatic wiring: create a Render webhook that triggers a Netlify deploy after Render completes a successful deploy (advanced).