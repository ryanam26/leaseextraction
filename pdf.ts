import Anthropic from '@anthropic-ai/sdk';
import fetch from 'node-fetch';
import fs from 'fs';

async function main() {
  // Method 1: Fetch and encode a remote PDF
  const pdfURL = "https://leaseagreement.s3.us-east-1.amazonaws.com/leaseagreementtest.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZKWOAHHAHDSSRT2X%2F20250311%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250311T173901Z&X-Amz-Expires=300&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEGIaCXVzLWVhc3QtMSJHMEUCIFM3kQ2mkMipirOADBxlmRwT5fpaMUxF5%2FCinaUNFD8VAiEAlbdJ8cjaQhrEfbe3A2jcFslDRCurNGoJAZ2CF1mo1IAqjAMIq%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2NDE0NTU4OTcwMjQiDCPNNd4m6C%2B6VOjbeSrgAo5HgxStpCr3OVwHDHraJdeHq78665GFw5vkYquL5xCgxy4vV6JpKAiUwcG4tfCG7ejYnFDIAaX6DBCEu%2FBORzThGTo53T9IiQpifNtb%2F%2FwCvptIy7LxjjCCDig1bhpVSBagJ1l8RM8w%2FZIJb006pYqOMymr5iCHhkIxwdfyTCiJE%2FDgrvoqC%2BQiHCrZ%2Br4%2BXsCclasArED7BRLEZEbaxuqUW1ktgDZXbFM5g1HaKoT9wMQUYnG7ffZY8ApVyTRtKHqGevtQQWKmCKVkezehwh0saXMl%2Baq0slQ2WgSfFetRKob7mfBaLs%2FhwAudjevoK60k5gyUV8MNOOJchTp%2BaAgihB2WWCSco7UUd93T9BHyDDh2EpfYDGj5%2BNFlYQOii%2BygWEB%2BU0EtyADIm%2FiFZqjdRMVl45yYKU3o9ukXuXcTADh%2Bk4ssQ%2FnDOBipU5WWkK%2F9X5uSB1q68EC9SJ6zM4owo%2BTBvgY6swLSDb7jx1%2Fn5uIUrYYpvfceXZiDXvA9Tcla%2F2g1uoVaVxxNcayROxlLPXXa0LbboTxkSjI9GUNBpXeGwb8WGQZlwfR3GQ2g8T7tVezZ2SRUwfG%2F%2BuGNY8TFGhYeLu6AeTwFhxhFtKkQoFMXte4sac5g9Hcg7%2Br6pv0oKk2TajwPpkKwDjASxM7X6b0HInl9mM6oukC0ZlX9kivwO5n5XZQm13hv1tLGs%2BHalXrf3ggd97D%2FOnkQxLhnctsDEc%2BoREZV2Sg%2B5d6McHZSqIDH9TV3b0mGyXrMJ5fJ9xAicO9BsfmZcVfOguvN%2FJWdS79MXOJdulq8HbT7VxVDtiGfDLEeTu8QeeiUdEHWJ%2FosTA7k6Ha1%2BJhPN8dlgUu95Cg0isev2J2G19xlngvzg5yIlaHWXhgh&X-Amz-Signature=1973265824e66ce4cce40e6d3a4079ac9aad9f06ceeeb83e2e89c95271233820&X-Amz-SignedHeaders=host&response-content-disposition=inline";
  const pdfResponse = await fetch(pdfURL);
  const arrayBuffer = await pdfResponse.arrayBuffer();
  const pdfBase64 = Buffer.from(arrayBuffer).toString('base64');
  
  // Method 2: Load from a local file
  // const pdfBase64 = fs.readFileSync('document.pdf').toString('base64');
  
  // Set your API key directly in the file
  const apiKey = "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"; // Replace with your actual Anthropic API key
  const anthropic = new Anthropic({ apiKey });
  
  const response = await anthropic.messages.create({
    model: 'claude-3-7-sonnet-20250219',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          },
          {
            type: 'text',
            text: `Extract the following data points from this lease agreement and return them in the exact JSON format provided below. If you cannot find a specific piece of information, use null for that field. Do not make up or assume any values. Only include data that is explicitly stated in the document.

IMPORTANT: Return ONLY the raw JSON with no additional formatting, markdown, or explanations.

Required JSON format:
{
 "monthlyRent": 1500.00,
 "annualRent": 18000.00,
 "address": "7136 Jamacha Rd Unit#B, San Diego, California 92114",
 "tenantName": "Jose Figueroa",
 "ownerName": "Angel Alberto Contreras Chiroque",
 "isSigned": false,
 "leaseTerm": 1,
 "startDate": "2024-05-01",
 "endDate": null,
 "isMonthToMonth": true
}

The above is just an example with sample values. Please replace with actual values from the document.`,
          },
        ],
      },
    ],
  });
  
  // Extract the JSON from markdown formatting if present
  let responseText = response.content[0].text;
  // Remove markdown code block formatting if present
  responseText = responseText.replace(/```json\s*|\s*```/g, '');
  
  console.log(JSON.parse(responseText));
}

main();
