
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-content.ts';
import '@/ai/flows/answer-questions.ts';
import '@/ai/flows/generate-study-questions.ts';
import '@/ai/flows/answer-follow-up.ts';
import '@/ai/flows/generate-image-flow.ts'; // Added new image generation flow
    
