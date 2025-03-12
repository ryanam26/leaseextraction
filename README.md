# PDF Lease Extractor

A web application that extracts key information from lease agreements using Claude AI.

## Features

- Upload PDF lease agreements via URL
- View the PDF document in the browser
- Extract key lease information automatically
- Display extracted data in a clean, organized format
- Edit extracted data with automatic recalculation of dependent fields

## Extracted Information

The application extracts the following data points from lease agreements:

- Monthly Rent
- Annual Rent
- Property Address
- Tenant Name
- Owner Name
- Lease Term
- Start Date
- End Date
- Whether the lease is Month-to-Month
- Whether the lease is signed

## Local Development Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example` and add your Anthropic API key:

```bash
cp .env.example .env
# Edit .env to add your API key
```

⚠️ **IMPORTANT**: Never commit your `.env` file or hardcode API keys in your code. The `.env` file is included in `.gitignore` to prevent accidental commits.

4. Start the development server:

```bash
npm run dev
```

5. In a separate terminal, start the backend server:

```bash
npm run server
```

6. Open your browser and navigate to http://localhost:5173

## Deployment to Vercel

### Prerequisites

1. Create a [Vercel account](https://vercel.com/signup)
2. Install the Vercel CLI:

```bash
npm install -g vercel
```

### Deployment Steps

1. Login to Vercel:

```bash
vercel login
```

2. Deploy the application:

```bash
vercel
```

3. Add your environment variables in the Vercel dashboard:
   - Go to your project settings
   - Navigate to the "Environment Variables" tab
   - Add `ANTHROPIC_API_KEY` with your API key

4. For production deployment:

```bash
vercel --prod
```

### Important Notes for Deployment

- After deployment, update the `vite.config.ts` file with your actual Vercel URL
- The free tier of Vercel has limitations on serverless function execution time, which may affect processing of large PDFs
- Consider setting up proper API key management for production use

## API Key Security

This application requires an Anthropic API key to function. To keep your API key secure:

1. **Never commit API keys to your repository**
2. Always use environment variables to store sensitive information
3. When deploying, use the platform's secure environment variable storage (like Vercel's Environment Variables)
4. Rotate your API keys periodically
5. Consider using API key management services for production applications

## Technologies Used

- React
- TypeScript
- Vite
- Express
- Anthropic Claude AI
- React PDF viewer
- Vercel for deployment 