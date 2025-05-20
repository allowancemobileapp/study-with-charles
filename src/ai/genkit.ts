
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Check for environment variable (for server-side logging only)
// This code runs when the module is loaded on the server.
if (typeof process !== 'undefined' && process.env) {
  const apiKeyEnvVars = ['GOOGLE_API_KEY', 'GOOGLE_GENAI_API_KEY', 'GEMINI_API_KEY'];
  const apiKeyPresent = apiKeyEnvVars.some(key => process.env[key]);

  if (!apiKeyPresent) {
    console.warn(
      `GENKIT_INIT_WARNING: None of the expected Google AI API key environment variables (${apiKeyEnvVars.join(', ')}) are set. The Google AI plugin may not function correctly.`
    );
  } else {
    console.log('GENKIT_INIT_INFO: A Google AI API key environment variable appears to be set.');
  }
}

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-flash-latest',
});

