import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface ForumQuestion {
  id: number;
  userId: number;
  title: string;
  content: string;
  createdAt: string;
}

interface ForumAnswer {
  id: number;
  questionId: number;
  userId: number;
  content: string;
  createdAt: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export default function Forum() {
  const { user } = useAuth();
  const [isNewQuestionOpen, setIsNewQuestionOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<ForumQuestion | null>(null);
  const [questionDetails, setQuestionDetails] = useState<{
    question: ForumQuestion,
    answers: ForumAnswer[]
  } | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [newQuestionData, setNewQuestionData] = useState({
    title: "",
    content: ""
  });
  const [newAnswerContent, setNewAnswerContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: questions, isLoading: isLoadingQuestions } = useQuery<ForumQuestion[]>({
    queryKey: ['/api/forum'],
  });
  
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const handleViewQuestion = async (question: ForumQuestion) => {
    try {
      const response = await fetch(`/api/forum/${question.id}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch question details');
      }
      
      const data = await response.json();
      setQuestionDetails(data);
      setIsDetailsOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load question details.",
        variant: "destructive",
      });
    }
  };

  const handleCreateQuestion = async () => {
    try {
      if (!newQuestionData.title.trim() || !newQuestionData.content.trim()) {
        toast({
          title: "Error",
          description: "Please fill in all fields.",
          variant: "destructive",
        });
        return;
      }

      await apiRequest('POST', '/api/forum', newQuestionData);
      
      queryClient.invalidateQueries({ queryKey: ['/api/forum'] });
      
      toast({
        title: "Question Posted",
        description: "Your question has been posted successfully.",
      });
      
      setIsNewQuestionOpen(false);
      setNewQuestionData({
        title: "",
        content: ""
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post question.",
        variant: "destructive",
      });
    }
  };

  const handlePostAnswer = async () => {
    try {
      if (!newAnswerContent.trim() || !questionDetails) {
        toast({
          title: "Error",
          description: "Please enter your answer.",
          variant: "destructive",
        });
        return;
      }

      await apiRequest('POST', `/api/forum/${questionDetails.question.id}/answers`, {
        content: newAnswerContent
      });
      
      // Refetch question details
      const response = await fetch(`/api/forum/${questionDetails.question.id}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch question details');
      }
      
      const data = await response.json();
      setQuestionDetails(data);
      
      toast({
        title: "Answer Posted",
        description: "Your answer has been posted successfully.",
      });
      
      setNewAnswerContent("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post answer.",
        variant: "destructive",
      });
    }
  };

  if (isLoadingQuestions || isLoadingUsers) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getUserName = (userId: number) => {
    const userObj = users?.find(u => u.id === userId);
    return userObj ? `${userObj.firstName} ${userObj.lastName}` : "Unknown User";
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Q&A Forum</h1>
          <p className="text-gray-600">Ask questions and share gardening knowledge</p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <Button onClick={() => setIsNewQuestionOpen(true)}>
            <span className="material-icons text-sm mr-1">help_outline</span>
            Ask a Question
          </Button>
        </div>
      </div>

      {/* Question List */}
      {questions?.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No questions have been posted yet.</p>
          <Button className="mt-4" onClick={() => setIsNewQuestionOpen(true)}>
            Be the first to ask a question
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {questions?.map(question => (
            <Card key={question.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleViewQuestion(question)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{question.title}</CardTitle>
                <div className="text-xs text-gray-500 flex justify-between items-center">
                  <span>Posted by {getUserName(question.userId)}</span>
                  <span>{formatDate(question.createdAt)}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-gray-600">{question.content}</p>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="link" className="p-0 h-auto text-primary">
                  Read More & Answer
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* New Question Dialog */}
      <Dialog open={isNewQuestionOpen} onOpenChange={setIsNewQuestionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ask a Question</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newQuestionData.title}
                onChange={(e) => setNewQuestionData({...newQuestionData, title: e.target.value})}
                placeholder="What's your gardening question?"
              />
            </div>
            
            <div>
              <Label htmlFor="content">Question Details</Label>
              <Textarea
                id="content"
                value={newQuestionData.content}
                onChange={(e) => setNewQuestionData({...newQuestionData, content: e.target.value})}
                placeholder="Provide details about your question..."
                rows={5}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewQuestionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateQuestion}>
              Post Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{questionDetails?.question.title}</DialogTitle>
            <div className="text-sm text-gray-500 flex justify-between">
              <span>Posted by {questionDetails ? getUserName(questionDetails.question.userId) : ""}</span>
              <span>{questionDetails ? formatDate(questionDetails.question.createdAt) : ""}</span>
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Question content */}
            <div className="bg-gray-50 rounded-md p-4">
              <p className="whitespace-pre-wrap">{questionDetails?.question.content}</p>
            </div>
            
            {/* Answers */}
            <div>
              <h3 className="font-medium text-lg mb-4">
                Answers ({questionDetails?.answers.length || 0})
              </h3>
              
              {questionDetails?.answers.length === 0 ? (
                <p className="text-gray-500 italic">No answers yet. Be the first to answer!</p>
              ) : (
                <div className="space-y-4">
                  {questionDetails?.answers.map(answer => (
                    <div key={answer.id} className="border-l-4 border-primary pl-4">
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>{getUserName(answer.userId)}</span>
                        <span>{formatDate(answer.createdAt)}</span>
                      </div>
                      <p className="mt-2">{answer.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Post an answer */}
            <div>
              <Label htmlFor="answer">Your Answer</Label>
              <Textarea
                id="answer"
                value={newAnswerContent}
                onChange={(e) => setNewAnswerContent(e.target.value)}
                placeholder="Share your knowledge or experience..."
                rows={4}
                className="mt-2"
              />
              
              <div className="flex justify-end mt-4">
                <Button onClick={handlePostAnswer}>
                  Post Answer
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
