import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Search, PlusCircle, MessageSquare } from "lucide-react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const topicFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  categoryId: z.string().min(1, "Category is required"),
});

type TopicFormValues = z.infer<typeof topicFormSchema>;

export default function Forum() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<TopicFormValues>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: {
      title: "",
      content: "",
      categoryId: "",
    },
  });

  // Fetch forum categories
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['/api/forum/categories'],
    queryFn: async () => {
      const res = await fetch('/api/forum/categories', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
  });

  // Fetch forum topics
  const { data: topics, isLoading: loadingTopics } = useQuery({
    queryKey: ['/api/forum/topics'],
    queryFn: async () => {
      const res = await fetch('/api/forum/topics', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch topics');
      return res.json();
    },
  });

  // Create a new forum topic
  const createTopic = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/forum/topics', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum/topics'] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Your topic has been posted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create topic",
        variant: "destructive",
      });
    },
  });

  // Filter topics based on search and category
  const filteredTopics = topics?.filter((topic: any) => {
    // Category filter
    if (selectedCategoryId && topic.categoryId !== parseInt(selectedCategoryId)) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const titleMatch = topic.title.toLowerCase().includes(searchQuery.toLowerCase());
      const contentMatch = topic.content.toLowerCase().includes(searchQuery.toLowerCase());
      return titleMatch || contentMatch;
    }

    return true;
  });

  const getCategoryName = (categoryId: number) => {
    const category = categories?.find((c: any) => c.id === categoryId);
    return category ? category.name : "";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleTopicClick = (id: number) => {
    navigate(`/forum/${id}`);
  };

  const onSubmitNewTopic = (values: TopicFormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a topic",
        variant: "destructive",
      });
      return;
    }

    createTopic.mutate({
      title: values.title,
      content: values.content,
      categoryId: parseInt(values.categoryId),
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-heading font-semibold">Community Forum</h2>
        <div className="flex space-x-2">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search topics..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute left-3 top-2.5">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          {user && (
            <Button onClick={() => setDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Topic
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingCategories ? (
                <div className="py-4 text-center text-gray-500">Loading categories...</div>
              ) : (
                <>
                  <div 
                    className={`py-2 px-3 rounded-md cursor-pointer ${
                      selectedCategoryId === null ? "bg-primary-light bg-opacity-10 text-primary font-medium" : "hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedCategoryId(null)}
                  >
                    All Topics
                  </div>
                  {categories?.map((category: any) => (
                    <div 
                      key={category.id}
                      className={`py-2 px-3 rounded-md cursor-pointer ${
                        selectedCategoryId === category.id.toString() ? "bg-primary-light bg-opacity-10 text-primary font-medium" : "hover:bg-gray-100"
                      }`}
                      onClick={() => setSelectedCategoryId(category.id.toString())}
                    >
                      {category.name}
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Topics List */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>
                {selectedCategoryId 
                  ? `Topics in ${getCategoryName(parseInt(selectedCategoryId))}`
                  : "Recent Topics"
                }
              </CardTitle>
              <CardDescription>
                Join the conversation with fellow gardeners
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTopics ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4">Loading topics...</p>
                </div>
              ) : filteredTopics && filteredTopics.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredTopics.map((topic: any) => (
                    <div 
                      key={topic.id}
                      className="p-5 hover:bg-gray-50 cursor-pointer transition duration-150"
                      onClick={() => handleTopicClick(topic.id)}
                    >
                      <div className="flex items-start">
                        <div className="mr-4">
                          <div className="w-10 h-10 rounded-full bg-primary-light bg-opacity-20 flex items-center justify-center text-primary font-medium">
                            {/* Placeholder initials */}
                            {topic.userId.toString().substring(0, 2).toUpperCase()}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-base font-semibold text-gray-800">{topic.title}</h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{topic.content}</p>
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            <span>
                              Posted {formatDate(topic.createdAt)} • in{" "}
                              <span className="text-primary">{getCategoryName(topic.categoryId)}</span>
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 text-center">
                          <div className="bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-gray-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No topics found
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Topic Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Topic</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitNewTopic)} className="space-y-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category: any) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a descriptive title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write your post here..."
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={createTopic.isPending}>
                  {createTopic.isPending ? "Posting..." : "Post Topic"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
