import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Get chatbot access token using Server-to-Server OAuth
 * @returns {Promise<string>} Access token
 */
export async function getChatbotToken() {
  try {
    if (!process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET) {
      throw new Error('Missing required environment variables: ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET');
    }

    const credentials = Buffer.from(
      `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
    ).toString('base64');

    const response = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP ${response.status}: ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Successfully received chatbot_token from Zoom.');
    return data.access_token;
  } catch (error) {
    console.error('Error getting chatbot_token from Zoom:', error.message);
    throw new Error(`Failed to get Zoom chatbot token: ${error.message}`);
  }
}