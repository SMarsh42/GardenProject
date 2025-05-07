import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";

interface Message {
  id: number;
  senderId: number;
  recipientId: number | null;
  subject: string;
  content: string;
  isGlobal: boolean;
  createdAt: string;
  readAt: string | null;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export default function Messages() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("inbox");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [composeData, setComposeData] = useState({
    subject: "",
    content: "",
    recipientId: "",
    isGlobal: false
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: messages, isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
  });
  
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const handleViewMessage = async (message: Message) => {
    setSelectedMessage(message);
    setIsViewOpen(true);

    // Mark as read if not already read
    if (!message.readAt) {
      try {
        await apiRequest('PUT', `/api/messages/${message.id}/read`, {});
        queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      } catch (error) {
        console.error("Failed to mark message as read", error);
      }
    }
  };

  const handleSendMessage = async () => {
    try {
      const payload = {
        subject: composeData.subject,
        content: composeData.content,
        recipientId: composeData.isGlobal ? null : parseInt(composeData.recipientId),
        isGlobal: composeData.isGlobal
      };

      await apiRequest('POST', '/api/messages', payload);
      
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
      
      setIsComposeOpen(false);
      setComposeData({
        subject: "",
        content: "",
        recipientId: "",
        isGlobal: false
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
    }
  };

  if (isLoadingMessages || isLoadingUsers) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const inboxMessages = messages?.filter(
    m => m.recipientId === user?.id || (m.isGlobal && m.senderId !== user?.id)
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const sentMessages = messages?.filter(
    m => m.senderId === user?.id
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const displayMessages = activeTab === "inbox" ? inboxMessages : sentMessages;

  const getSenderName = (senderId: number) => {
    const sender = users?.find(u => u.id === senderId);
    return sender ? `${sender.firstName} ${sender.lastName}` : "Unknown User";
  };

  const getRecipientName = (recipientId: number | null) => {
    if (recipientId === null) return "All Users (Global)";
    const recipient = users?.find(u => u.id === recipientId);
    return recipient ? `${recipient.firstName} ${recipient.lastName}` : "Unknown User";
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
          <p className="text-gray-600">Communicate with gardeners and managers</p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <Button onClick={() => setIsComposeOpen(true)}>
            <span className="material-icons text-sm mr-1"></span>
            Compose Message
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Your Messages</CardTitle>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="inbox">Inbox</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {displayMessages?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No messages in your {activeTab}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {displayMessages?.map(message => {
                const isUnread = activeTab === "inbox" && !message.readAt;
                
                return (
                  <div 
                    key={message.id} 
                    className={`py-4 cursor-pointer hover:bg-gray-50 ${isUnread ? 'font-medium' : ''}`}
                    onClick={() => handleViewMessage(message)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className={`text-sm ${isUnread ? 'font-semibold' : 'font-medium'}`}>
                          {message.subject}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {activeTab === "inbox" 
                            ? `From: ${getSenderName(message.senderId)}` 
                            : `To: ${getRecipientName(message.recipientId)}`}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(message.createdAt)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-1">{message.content}</p>
                    {isUnread && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          New
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compose Message Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Compose Message</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is-global"
                checked={composeData.isGlobal}
                onChange={(e) => setComposeData({...composeData, isGlobal: e.target.checked})}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="is-global">Send to all users</Label>
            </div>
            
            {!composeData.isGlobal && (
              <div>
                <Label htmlFor="recipient">Recipient</Label>
                <Select 
                  value={composeData.recipientId} 
                  onValueChange={(value) => setComposeData({...composeData, recipientId: value})}
                >
                  <SelectTrigger id="recipient">
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.filter(u => u.id !== user?.id).map(u => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {`${u.firstName} ${u.lastName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={composeData.subject}
                onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                placeholder="Message subject"
              />
            </div>
            
            <div>
              <Label htmlFor="content">Message</Label>
              <Textarea
                id="content"
                value={composeData.content}
                onChange={(e) => setComposeData({...composeData, content: e.target.value})}
                placeholder="Enter your message"
                rows={5}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage}>
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Message Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-500">
              <div>
                <p><strong>From:</strong> {selectedMessage ? getSenderName(selectedMessage.senderId) : ""}</p>
                {selectedMessage?.recipientId && (
                  <p><strong>To:</strong> {getRecipientName(selectedMessage.recipientId)}</p>
                )}
                {selectedMessage?.isGlobal && (
                  <p><strong>To:</strong> All Users (Global)</p>
                )}
              </div>
              <p>{selectedMessage ? formatDate(selectedMessage.createdAt) : ""}</p>
            </div>
            
            <div className="bg-gray-50 rounded-md p-4">
              <p className="whitespace-pre-wrap">{selectedMessage?.content}</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsComposeOpen(true);
              setIsViewOpen(false);
              setComposeData({
                subject: `Re: ${selectedMessage?.subject}`,
                content: "",
                recipientId: selectedMessage?.senderId.toString() || "",
                isGlobal: false
              });
            }}>
              Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
