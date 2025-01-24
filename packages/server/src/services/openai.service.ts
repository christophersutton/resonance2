import OpenAI from 'openai';
import { config } from '../config';

export interface MessageClassification {
  taskType: 'FEATURE_REQUEST' | 'BUG' | 'REVISION' | 'RESEARCH' | 'QUESTION';
  serviceCategory: 'STRATEGY' | 'DESIGN' | 'DEV' | 'CONSULT';
  urgency: 'urgent' | 'medium' | 'low';
  title: string;
  description: string;
}

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.auth.openai.apiKey,
    });
  }

  async classifyMessage(content: string): Promise<MessageClassification> {
    console.log('🤖 Preparing OpenAI classification request');
    const prompt = `Analyze the following message and classify it according to our task system. 
    Extract the following information:
    - Task type (FEATURE_REQUEST, BUG, REVISION, RESEARCH, or QUESTION)
    - Service category (STRATEGY, DESIGN, DEV, or CONSULT)
    - Urgency (urgent, medium, or low)
    - A concise title
    - A clear description
    
    Message:
    ${content}
    
    Respond in JSON format only.`;

    console.log('📤 Sending request to OpenAI...');
    const response = await this.client.chat.completions.create({
      model: config.auth.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that analyzes and classifies incoming client messages for a software development and consulting company. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
    });
    console.log('📥 Received OpenAI response');

    const result = JSON.parse(response.choices[0].message.content || '{}');
    console.log('✅ Parsed classification:', result);
    
    return {
      taskType: result.taskType,
      serviceCategory: result.serviceCategory,
      urgency: result.urgency,
      title: result.title,
      description: result.description,
    };
  }
}

export const openAIService = new OpenAIService();
