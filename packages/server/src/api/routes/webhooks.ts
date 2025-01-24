import { Hono } from 'hono';
import { emailService } from '../../services/email.service';
import { ClientRepository } from '../../db/repositories/client';
import { MessageRepository } from '../../db/repositories/message';
import { TaskRepository } from '../../db/repositories/task';

interface WebhookDependencies {
  clientRepo: ClientRepository;
  messageRepo: MessageRepository;
  taskRepo: TaskRepository;
}

export function webhookRoutes(deps: WebhookDependencies) {
  const app = new Hono();

  app.post('/email', async (c) => {
    console.log('📨 Received webhook request');
    const body = await c.req.parseBody();
    console.log('📝 Webhook payload:', {
      sender: body['sender'],
      recipient: body['recipient'],
      subject: body['subject'],
      messageId: body['Message-Id'],
      inReplyTo: body['In-Reply-To'],
    });
    
    // Validate webhook signature
    const signature = c.req.header('X-Mailgun-Signature');
    const token = c.req.header('X-Mailgun-Token');
    const timestamp = c.req.header('X-Mailgun-Timestamp');
    
    console.log('🔐 Validating webhook signature:', { signature, token, timestamp });
    
    if (!signature || !token || !timestamp || 
        !emailService.validateWebhookSignature(timestamp, token, signature)) {
      console.error('❌ Invalid webhook signature');
      return c.json({ error: 'Invalid webhook signature' }, 401);
    }

    try {
      // Find client by email
      const sender = body['sender'];
      console.log('🔍 Looking up client by email:', sender);
      const client = await deps.clientRepo.findByEmail(sender);
      
      if (!client) {
        console.error('❌ Unknown sender:', sender);
        return c.json({ error: 'Unknown sender' }, 404);
      }
      console.log('✅ Found client:', { id: client.id, name: client.organization_name });

      // Process email content
      const emailData = {
        sender,
        recipient: body['recipient'],
        subject: body['subject'],
        body: {
          plain: body['body-plain'],
          html: body['body-html'],
        },
        timestamp,
        signature,
        token,
        timestamp_token: body['timestamp'],
      };

      console.log('🤖 Processing email content with AI...');
      const { classification, cleanContent } = await emailService.processIncomingEmail(emailData);
      console.log('✅ AI Classification:', classification);

      // Create message record
      console.log('💾 Creating message record...');
      const message = await deps.messageRepo.create({
        clientId: client.id,
        direction: 'inbound',
        body: cleanContent,
        metadata: {
          email: {
            subject: emailData.subject,
            thread_id: body['In-Reply-To'] || body['Message-Id'],
          },
        },
      });
      console.log('✅ Created message:', { id: message.id });

      // Create or update task
      console.log('📋 Creating task...');
      const task = await deps.taskRepo.create({
        clientId: client.id,
        type: classification.taskType,
        serviceCategory: classification.serviceCategory,
        urgency: classification.urgency,
        title: classification.title,
        description: classification.description,
        status: 'open',
      });
      console.log('✅ Created task:', { id: task.id, title: task.title });

      // Link message to task
      console.log('🔗 Linking message to task...');
      await deps.messageRepo.update(message.id, {
        taskId: task.id,
      });
      console.log('✅ Message linked to task');

      return c.json({
        status: 'success',
        message: {
          id: message.id,
          task_id: task.id,
        },
      });
    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      return c.json({ error: 'Internal server error', details: error.message }, 500);
    }
  });

  return app;
}
