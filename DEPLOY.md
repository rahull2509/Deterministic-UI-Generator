# Deployment Guide for Ryze AI App

The easiest way to deploy this Next.js application is to use [Vercel](https://vercel.com).

## Prerequisites
1.  A GitHub account.
2.  A Vercel account.

## Steps

1.  **Push to GitHub**:
    - Commit all changes:
      ```bash
      git add .
      git commit -m "Initial commit of Ryze AI Generator"
      ```
    - Create a new repository on GitHub.
    - Push your code:
      ```bash
      git remote add origin https://github.com/YOUR_USERNAME/ryze-ai-generator.git
      git branch -M main
      git push -u origin main
      ```

2.  **Deploy on Vercel**:
    - Go to https://vercel.com/new.
    - Import your `ryze-ai-generator` repository.
    - **Environment Variables**:
      - Add `GEMINI_API_KEY` with your Google Gemini API Key.
    - Click **Deploy**.

## Verification
- Once deployed, Vercel will provide a URL (e.g., `https://ryze-ai-generator.vercel.app`).
- Open the URL and test the agent.

## Note on API Keys
- Ensure your API key has usage limits set to avoid unexpected costs.
- The key is stored securely in Vercel's environment variables.
