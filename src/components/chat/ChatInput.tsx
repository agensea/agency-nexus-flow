
import React, { useState, ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send } from "lucide-react";
import { Attachment } from "@/types";
import { useChat } from "@/contexts/ChatContext";

interface ChatInputProps {
  roomId: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ roomId }) => {
  const { sendMessage, loading } = useChat();
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // In a real app, you would upload the files to a storage service
    // and get back URLs. Here we're just mocking it.
    const newAttachments = Array.from(files).map((file) => ({
      id: `attach-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      type: file.type,
      uploadedBy: "current-user-id", // In a real app, this would be the actual user ID
      uploadedAt: new Date(),
    }));

    setAttachments([...attachments, ...newAttachments]);
    
    // Reset the file input
    e.target.value = "";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if ((!message.trim() && attachments.length === 0) || submitting) return;
    
    setSubmitting(true);
    try {
      await sendMessage(roomId, message, attachments.length > 0 ? attachments : undefined);
      setMessage("");
      setAttachments([]);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter(a => a.id !== id));
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4 bg-card">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((attachment) => (
            <div 
              key={attachment.id} 
              className="flex items-center gap-1 bg-muted p-1 px-2 rounded text-xs"
            >
              <span className="truncate max-w-[100px]">{attachment.name}</span>
              <button 
                type="button" 
                className="text-muted-foreground hover:text-destructive"
                onClick={() => removeAttachment(attachment.id)}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Textarea
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[80px] resize-none pr-12"
            disabled={submitting || loading}
          />
          <div className="absolute right-2 bottom-2">
            <label htmlFor="file-upload" className="cursor-pointer">
              <Paperclip className="h-5 w-5 text-muted-foreground hover:text-primary" />
              <input
                id="file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={submitting || loading}
              />
            </label>
          </div>
        </div>
        <Button 
          type="submit" 
          className="self-end" 
          disabled={(!message.trim() && attachments.length === 0) || submitting || loading}
        >
          <Send className="h-5 w-5" />
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </form>
  );
};

export default ChatInput;
