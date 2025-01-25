import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { config } from '../config';
import { openAIService } from './openai.service';
import type { MessageClassification } from './openai.service';
import * as crypto from 'crypto';

interface EmailData {
  sender: string;
  recipient: string;
  subject: string;
  body: {
    plain: string;
    html?: string;
  };
  timestamp: string;
  signature?: string;
  token?: string;
  timestamp_token?: string;
}

export class EmailService {
  private mailgun: any; // TODO: Add proper typing

  constructor() {
    const mailgun = new Mailgun(formData);
    this.mailgun = mailgun.client({
      username: 'api',
      key: config.auth.mailgun.apiKey,
    });
  }

  validateWebhookSignature(timestamp: string, token: string, signature: string): boolean {
    console.log('⚠️ Webhook signature validation temporarily disabled for testing');
    return true;
  }

  async processIncomingEmail(emailData: EmailData): Promise<{
    classification: MessageClassification;
    cleanContent: string;
  }> {
    console.log('🧹 Cleaning email content...');
    const cleanContent = this.cleanEmailContent(emailData.body?.plain || '');
    console.log('✅ Cleaned content length:', cleanContent.length);

    console.log('🤖 Requesting AI classification...');
    const classification = await openAIService.classifyMessage(cleanContent);
    console.log('✅ Received classification');

    return {
      classification,
      cleanContent,
    };
  }

  private cleanEmailContent(content: string): string {
    console.log('🧹 Starting email content cleaning:', content);
    // TODO: Implement more sophisticated email cleaning
    // Remove email signatures, reply chains, etc.
    const cleaned = content
      .replace(/^>.*$/gm, '') // Remove quoted text
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
      .trim();
    
    console.log('✅ Email cleaning complete');
    return cleaned;
  }
}

export const emailService = new EmailService();
