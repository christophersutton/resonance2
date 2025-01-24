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
    Extract the following information and return it in JSON format with these exact field names:
    {
      "taskType": "(FEATURE_REQUEST, BUG, REVISION, RESEARCH, or QUESTION)",
      "serviceCategory": "(STRATEGY, DESIGN, DEV, or CONSULT)",
      "urgency": "(urgent, medium, or low)",
      "title": "A concise title",
      "description": "A clear description"
    }
    
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
    console.log('📊 Raw OpenAI response:', response.choices[0].message.content);
    console.log('🔍 Parsed result:', result);
    
    // Normalize field names from the response
    const normalizedResult = {
      taskType: result.taskType || result['Task type'],
      serviceCategory: result.serviceCategory || result['Service category'],
      urgency: result.urgency || result['Urgency'],
      title: result.title || result['Title'],
      description: result.description || result['Description']
    };
    
    console.log('🔄 Normalized result:', normalizedResult);
    
    // Validate required fields
    const requiredFields = ['taskType', 'serviceCategory', 'urgency', 'title', 'description'];
    const missingFields = requiredFields.filter(field => !normalizedResult[field]);
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields in normalized result:', missingFields);
      throw new Error(`OpenAI response missing required fields: ${missingFields.join(', ')}`);
    }
    
    console.log('✅ Final classification:', normalizedResult);
    return normalizedResult;
  }
}

export const openAIService = new OpenAIService();
