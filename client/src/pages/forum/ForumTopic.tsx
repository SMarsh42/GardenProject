import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function ForumTopic() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [replyContent, setReplyContent] = useState("");

  // Fetch the topic details
  const { data: topic, isLoading: loadingTopic } = useQuery({
    queryKey: ['/api/forum/topics', parseInt(id)],
    queryFn: async () => {
      const res = await fetch(`/api/forum/topics/${id}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch topic');
      return res.json();
    },
  });

  // Fetch the topic category
  const { data: category } = useQuery({
    queryKey: ['/api/forum/categories', topic?.categoryId],
    queryFn: async () => {
      const res = await fetch(`/api/forum/categories/${topic?.categoryId}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch category');
      return res.json();
    },
    enabled: !!topic?.categoryId,
  });

  // Fetch the topic author
  const { data: author } = useQuery({
    queryKey: ['/api/users', topic?.userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${topic?.userId}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    },
    enabled: !!topic?.userId,
  });

  // Fetch replies to this topic
  const { data: replies, isLoading: loadingReplies } = useQuery({
    queryKey: ['/api/forum/topics', parseInt(id), 'replies'],
    queryFn: async () => {
      const res = await fetch(`/api/forum/topics/${id}/replies`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch replies');
      return res.json();
    },
    enabled: !!id,
  });

  // Create a new reply
  const createReply = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', `/api/forum/topics/${id}/replies`, { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum/topics', parseInt(id), 'replies'] });
      setReplyContent("");
      toast({
        title: "Success",
        description: "Your reply has been posted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleSubmitReply = () => {
    if (!replyContent.trim()) {
      toast({
        title: "Error",
        description: "Reply cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to reply",
        variant: "destructive",
      });
      return;
    }

    createReply.mutate(replyContent);
  };

  if (loadingTopic) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4">Loading topic...</p>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="max-w-4xl mx-auto mt-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Topic Not Found</h2>
        <p className="mb-4">The topic you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button asChild>
          <a href="/forum">Return to Forum</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/forum")}
          className="mr-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Forum
        </Button>
        <h2 className="text-2xl font-heading font-semibold">Forum Topic</h2>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{topic.title}</CardTitle>
              <CardDescription>
                in {category?.name || 'Loading category...'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary-light bg-opacity-20 text-primary">
                {author ? getInitials(author.firstName, author.lastName) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {author ? `${author.firstName} ${author.lastName}` : 'Unknown User'}
              </div>
              <div className="text-sm text-gray-500">
                Posted on {formatDate(topic.createdAt)}
              </div>
              <div className="mt-4 text-gray-700 whitespace-pre-wrap">
                {topic.content}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Replies</h3>
        
        {loadingReplies ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm">Loading replies...</p>
          </div>
        ) : replies && replies.length > 0 ? (
          <div className="space-y-6">
            {replies.map((reply: any) => (
              <div key={reply.id} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-secondary-light bg-opacity-20 text-secondary">
                      {/* Show initials (placeholder) */}
                      {reply.userId.toString().substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div className="font-medium">User #{reply.userId}</div>
                      <div className="text-sm text-gray-500">
                        {formatDate(reply.createdAt)}
                      </div>
                    </div>
                    <div className="mt-2 text-gray-700 whitespace-pre-wrap">
                      {reply.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
            No replies yet. Be the first to respond!
          </div>
        )}
      </div>

      {user ? (
        <Card>
          <CardHeader>
            <CardTitle>Post a Reply</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Write your reply here..."
              className="min-h-[150px]"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={handleSubmitReply}
              disabled={createReply.isPending}
            >
              <Send className="mr-2 h-4 w-4" />
              {createReply.isPending ? "Posting..." : "Post Reply"}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="mb-4 text-gray-500">You must be logged in to reply</p>
            <Button asChild>
              <a href="/login">Login to Reply</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
