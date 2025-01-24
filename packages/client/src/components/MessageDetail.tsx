import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { useMessage } from "../contexts/MessageContext";
import type { Message } from "../contexts/MessageContext";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "../lib/utils";
import { useClient } from "../contexts/ClientContext";

type MessageDetailProps = {
  message: Message;
  onBack: () => void;
};

export const MessageDetail = ({ message, onBack }: MessageDetailProps) => {
  const [reply, setReply] = useState("");
  const { createMessage, sendMessage } = useMessage();
  const { selectedClient } = useClient();

  const getDateDivider = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;

    const newMessage = await createMessage({
      clientId: message.clientId,
      taskId: message.taskId,
      direction: 'outbound',
      body: reply,
      status: 'sent',
      sentAt: new Date().toISOString()
    });

    if (newMessage) {
      setReply("");
      // No need to call sendMessage since it's already sent
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          {selectedClient && (
            <h2 className="text-lg font-medium text-blue-600">
              {selectedClient.organizationName}
            </h2>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground">
              {getDateDivider(new Date(message.createdAt))}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className={cn(
            "flex w-full mb-8 flex-col",
            message.direction === 'inbound' ? "items-start" : "items-end"
          )}>
            {message.direction === 'inbound' && selectedClient && (
              <div className="flex items-baseline gap-2 mb-1 ml-4">
                <span className="text-sm font-medium">
                  {selectedClient.firstName}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {format(new Date(message.createdAt), 'h:mm a')}
                </span>
              </div>
            )}
            <div className={cn(
              "max-w-[80%] p-4 rounded-lg",
              message.direction === 'inbound'
                ? "bg-gray-100 rounded-tl-none"
                : "bg-blue-500 text-white rounded-tr-none",
              message.status === 'draft' && "opacity-70"
            )}>
              <p className="text-sm">{message.body}</p>
              <div className={cn(
                "flex items-center gap-2 text-[11px] mt-1",
                message.direction === 'inbound' ? "text-gray-500" : "text-blue-100"
              )}>
                {message.status === 'draft' && (
                  <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-xs">
                    Draft
                  </span>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Textarea
                placeholder="Type your reply..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="min-h-[100px] pr-24 resize-none"
              />
              <Button 
                type="submit" 
                size="sm"
                className="absolute bottom-3 right-3 gap-2"
                disabled={!reply.trim()}
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};