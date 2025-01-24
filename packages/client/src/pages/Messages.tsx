import { MessageSquare, Clock } from "lucide-react";
import { useClient } from "@/contexts/ClientContext";
import { useMessage } from "@/contexts/MessageContext";
import { useState, useEffect } from "react";
import { MessageDetail } from "@/components/MessageDetail";
import type { Message } from "@/contexts/MessageContext";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

const Messages = () => {
  const { selectedClient } = useClient();
  const { messages, loading, fetchMessages } = useMessage();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (selectedClient?.id) {
      fetchMessages(selectedClient.id);
    }
  }, [selectedClient?.id, fetchMessages]);

  const getDateDivider = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt);
    const dateStr = format(date, "yyyy-MM-dd");
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  if (selectedMessage) {
    return (
      <div className="flex-1 p-8 bg-background">
        <MessageDetail
          message={selectedMessage}
          onBack={() => setSelectedMessage(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <div className="px-8 py-6 border-b">
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        {selectedClient && (
          <p className="text-lg font-medium text-blue-600">
            {selectedClient.organizationName}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading messages...</div>
          ) : messages.length > 0 ? (
            Object.entries(groupedMessages)
              .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
              .map(([dateStr, dateMessages]) => (
                <div key={dateStr} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {getDateDivider(new Date(dateStr))}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  {dateMessages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex w-full flex-col",
                        message.direction === 'INBOUND' ? "items-start" : "items-end"
                      )}
                    >
                      {message.direction === 'INBOUND' && selectedClient && (
                        <div className="flex items-baseline gap-2 mb-1 ml-4">
                          <span className="text-sm font-medium">
                            {selectedClient.firstName}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {format(new Date(message.createdAt), 'h:mm a')}
                          </span>
                        </div>
                      )}
                      <button
                        className={cn(
                          "max-w-[80%] p-4 rounded-lg text-left transition-colors",
                          message.direction === 'INBOUND'
                            ? "bg-gray-100 rounded-tl-none"
                            : "bg-blue-500 text-white rounded-tr-none",
                          message.status === 'draft' && "opacity-70"
                        )}
                        onClick={() => setSelectedMessage(message)}
                      >
                        <p className="text-sm">{message.body}</p>
                        <div className={cn(
                          "flex items-center gap-2 text-[11px] mt-1",
                          message.direction === 'INBOUND' ? "text-gray-500" : "text-blue-100"
                        )}>
                          {message.status === 'draft' && (
                            <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-xs">
                              Draft
                            </span>
                          )}
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              ))
          ) : (
            <div className="text-center text-muted-foreground">
              No messages found for this client
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;