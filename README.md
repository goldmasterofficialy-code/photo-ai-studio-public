# PHOTO AI — Professional Creative Platform Starter

A separate React + Vite frontend and Express API scaffold. It does not touch the existing PDFSmart project.

## Included in this build
- Professional responsive dashboard UI
- English and Hindi language switch
- Tool navigation for AI generation, AI editing, poster maker, background removal, enhancement and resize
- Local photo upload (JPG/PNG/WEBP, up to 15 MB)
- Browser-side brightness, contrast and saturation adjustments
- Editable poster headline/subtitle and PNG export
- Express backend health endpoint
- Secure API route placeholders for AI generation and editing (API keys remain server-side)
- `.env.example` and `.gitignore`

## Requirements
Install Node.js LTS and VS Code.

## Run the frontend
Open this folder in VS Code, open Terminal, and run:

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually http://localhost:5173).

## Run the API in a second terminal
```bash
npm run server
```
Health check: http://localhost:8787/api/health

## Important AI integration status
The UI and backend routes are scaffolded, but AI generation/editing are NOT live yet. The API routes deliberately return a clear 503/501 response until an image AI provider is selected and its backend adapter is implemented. Do not paste API keys into React files or commit `.env` to GitHub.

## Next production phases
1. Choose an AI provider and implement its server adapter.
2. Add authentication and database-backed projects.
3. Add object storage and signed uploads.
4. Add credits, payment gateway, rate limits and abuse protection.
5. Add admin console, monitoring, privacy/terms, backups and deployment.
