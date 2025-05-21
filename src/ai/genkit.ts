
import { genkit, type GenkitPlugin } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

let apiKeyPresent = false;
let googleAiPluginInstance: GenkitPlugin | null = null;
const initializationErrors: string[] = [];

console.log('GENKIT_INIT_LOG: Starting Genkit initialization...');

if (typeof process !== 'undefined' && process.env) {
  console.log('GENKIT_INIT_LOG: process.env is available.');
  const apiKeyEnvVars = ['GOOGLE_API_KEY', 'GOOGLE_GENAI_API_KEY', 'GEMINI_API_KEY'];
  const foundApiKeyVar = apiKeyEnvVars.find(key => process.env[key]);

  if (foundApiKeyVar && process.env[foundApiKeyVar]) {
    apiKeyPresent = true;
    console.log(`GENKIT_INIT_INFO: Google AI API key found in env variable '${foundApiKeyVar}'. Attempting to initialize GoogleAI plugin.`);
    try {
      // The googleAI() plugin is designed to pick up the API key from process.env automatically.
      googleAiPluginInstance = googleAI();
      console.log('GENKIT_INIT_SUCCESS: GoogleAI plugin initialized successfully.');
    } catch (e: any) {
      console.error('CRITICAL_GENKIT_INIT_ERROR: Failed to initialize GoogleAI plugin. AI features will NOT work properly or at all.', e.message, e.stack, e);
      initializationErrors.push(`Failed to initialize GoogleAI plugin: ${e.message || String(e)}`);
      googleAiPluginInstance = null; // Ensure it's null if init fails
    }
  } else {
    apiKeyPresent = false;
    const errorMessage = `CRITICAL_GENKIT_INIT_ERROR: None of the expected Google AI API key environment variables (${apiKeyEnvVars.join(', ')}) are set. GoogleAI plugin will NOT be initialized. AI features will NOT work.`;
    console.error(errorMessage);
    initializationErrors.push(`Google AI API key not found in environment variables: ${apiKeyEnvVars.join(', ')}.`);
  }
} else {
  const warningMessage = 'GENKIT_INIT_WARNING: process.env is not available. This might be normal in some client-side contexts but is unexpected for server-side Genkit initialization. GoogleAI plugin might not initialize.';
  console.warn(warningMessage);
  initializationErrors.push('process.env not available during Genkit initialization.');
}

const pluginsToUse: GenkitPlugin[] = [];
if (googleAiPluginInstance) {
  pluginsToUse.push(googleAiPluginInstance);
} else {
  console.warn('GENKIT_INIT_WARNING: GoogleAI plugin instance is not available. Genkit will be initialized without it. AI features will not function.');
}

export const ai = genkit({
  plugins: pluginsToUse,
  // model: 'googleai/gemini-1.5-flash-latest', // Default model can be specified here or per call
});

console.log(`GENKIT_INIT_LOG: Genkit initialization complete. GoogleAI plugin ${googleAiPluginInstance ? 'LOADED' : 'NOT LOADED'}.`);

// For potential debugging on the client or in other server modules if needed, though primarily rely on server logs.
export const genkitSetupDetails = {
  apiKeyWasDetected: apiKeyPresent,
  isGoogleAIPluginActive: !!googleAiPluginInstance,
  initializationErrors: initializationErrors,
};
