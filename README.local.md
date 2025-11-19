# Local development — quick start

This file explains how to run the project locally and test changes before committing.

1) Create local env files

  - Copy `.env.example` to `.env` in the project root and fill in real values (use a test Neon DB and test Cloudinary account).
  - For client-specific variables, you can create `client/.env.local` or put them in `.env` depending on your setup.

2) Start backend (watch mode)

  ```powershell
  npm run dev:server
  ```

  The server listens on `PORT` (default `3005`).

3) Start frontend (Vite) in another terminal

  ```powershell
  npm run dev:client
  ```

  Vite serves the client (default `http://localhost:8080`).

4) Smoke tests

  - Open the client in your browser and exercise features that call the backend.
  - Check logs in both terminals for errors.

5) Safe migration workflow

  - Run migrations locally against a test DB (do not run directly against production). Example:

    ```powershell
    $env:DATABASE_URL='postgres://...test...'; npm run db:push
    ```

6) Git workflow

  - Create a feature branch, test locally, then `git add`, `git commit -m "..."`, `git push` and open a PR.

Notes

  - Do not commit `.env` files. Add `.env` to `.gitignore` if needed.
  - Use CI secrets (Vercel/Render) for production Neon/Cloudinary credentials.
