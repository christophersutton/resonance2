import { Hono } from 'hono';
import { emailService } from '../../services/email.service';
import { MessageRepository } from '../../db/repositories/message';
import { TaskRepository } from '../../db/repositories/task';
import { ClientRepository } from '../../db/repositories/client';
import { MessageClassification } from '../../services/openai.service';
import { Task } from '../../../../shared/src/types/entities';

export const webhookRoutes = ({ messageRepo, taskRepo, clientRepo }: { 
    messageRepo: MessageRepository;
    taskRepo: TaskRepository;
    clientRepo: ClientRepository;
}) => {
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
        XMailgunSignature: c.req.header('X-Mailgun-Signature'),
        XMailgunTimestamp: c.req.header('X-Mailgun-Timestamp'),
        XMailgunToken: c.req.header('X-Mailgun-Token'),
      });
      
      // Validate webhook signature
     
      try {
        // Find client by email
        console.log('🔍 Looking up sender...');
        const sender = body['sender'];
        if (typeof sender !== 'string') {
          console.error('❌ Invalid sender type:', typeof sender);
          return c.json({ error: 'Invalid sender format' }, 400);
        }
        console.log('🔍 Looking up client by email:', sender);
        const client = await clientRepo.findByEmail(sender);
        
        if (!client) {
          console.error('❌ Unknown sender:', sender);
          return c.json({ error: 'Unknown sender' }, 404);
        }
        console.log('✅ Found client:', { id: client.id, name: client.organizationName });

        // Process email content
        const emailData = {
          sender: body['sender']?.toString(),
          recipient: body['recipient']?.toString(),
          subject: body['subject']?.toString(),
          body: {
            plain: body['body-plain']?.toString(),
            html: body['body-html']?.toString(),
          },
       
          timestamp: new Date().toISOString(),
          timestamp_token: body['timestamp']?.toString(),
        };

        //
        console.log('🧪 Using test email data for development');
        const { classification, cleanContent } = await emailService.processIncomingEmail(emailData);
        
        console.log('✅ AI Classification:', classification);

        // Create message record
        console.log('💾 Creating message record...');
        const message = await messageRepo.create({
          clientId: client.id,
          direction: 'inbound',
          body: cleanContent,
          sentAt: 'timestamp',
        });
        console.log('✅ Created message:', { id: message.id });

        // Create or update task
        console.log('📋 Creating task...');
        const taskData = {
          clientId: client.id,
          type: classification.taskType,
          serviceCategory: classification.serviceCategory,
          urgency: classification.urgency,
          title: classification.title,
          description: classification.description,
          status: 'open',
        };
        console.log('🔍 Task data:', taskData);
        const task = await taskRepo.create(taskData as Omit<Task, "id" | "createdAt">);
        console.log('✅ Created task:', { id: task.id, title: task.title });

        // Link message to task
        console.log('🔗 Linking message to task...');
        await messageRepo.update(message.id, {
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
