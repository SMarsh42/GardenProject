import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Search, Plus, Filter } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const paymentFormSchema = z.object({
  userId: z.string().min(1, "User is required"),
  plotId: z.string().min(1, "Plot is required"),
  amount: z.string().min(1, "Amount is required"),
  paymentType: z.enum(["cash", "check", "online"]),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export default function Payments() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Check if user has access
  const isManager = user?.role === "manager";
  const isCommittee = user?.role === "committee";
  const hasAccess = isManager || isCommittee;

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      userId: "",
      plotId: "",
      amount: "",
      paymentType: "cash",
      notes: "",
    },
  });

  // Fetch all payments
  const { data: payments, isLoading } = useQuery({
    queryKey: ['/api/payments'],
    queryFn: async () => {
      const res = await fetch('/api/payments', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch payments');
      return res.json();
    },
    enabled: hasAccess,
  });

  // Fetch users
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await fetch('/api/users', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
    enabled: hasAccess,
  });

  // Fetch plots
  const { data: plots } = useQuery({
    queryKey: ['/api/plots'],
    queryFn: async () => {
      const res = await fetch('/api/plots', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch plots');
      return res.json();
    },
    enabled: hasAccess,
  });

  // Create a new payment
  const createPayment = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/payments', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  // Filter payments based on search
  const filteredPayments = payments?.filter((payment: any) => {
    if (!searchQuery) return true;
    
    const user = users?.find((u: any) => u.id === payment.userId);
    const userName = user ? `${user.firstName} ${user.lastName}`.toLowerCase() : "";
    const plot = plots?.find((p: any) => p.id === payment.plotId);
    const plotNumber = plot ? plot.plotNumber.toLowerCase() : "";
    const searchLower = searchQuery.toLowerCase();
    
    return userName.includes(searchLower) || plotNumber.includes(searchLower);
  });

  const getUserName = (userId: number) => {
    const user = users?.find((u: any) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : `User #${userId}`;
  };

  const getPlotNumber = (plotId: number) => {
    const plot = plots?.find((p: any) => p.id === plotId);
    return plot ? plot.plotNumber : `Plot #${plotId}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const onSubmitNewPayment = (values: PaymentFormValues) => {
    const amountInCents = Math.round(parseFloat(values.amount) * 100);
    
    if (isNaN(amountInCents) || amountInCents <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }
    
    createPayment.mutate({
      userId: parseInt(values.userId),
      plotId: parseInt(values.plotId),
      amount: amountInCents,
      paymentType: values.paymentType,
      notes: values.notes || undefined,
    });
  };

  // If user doesn't have access
  if (!hasAccess) {
    return (
      <div className="max-w-4xl mx-auto mt-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Access Denied</h2>
        <p className="mb-4">You don't have permission to view this page.</p>
        <Button asChild>
          <a href="/">Return to Dashboard</a>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-heading font-semibold">Payments</h2>
        <div className="flex space-x-2">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search payments..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute left-3 top-2.5">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {payments ? formatCurrency(
                payments.reduce((sum: number, payment: any) => sum + payment.amount, 0)
              ) : "$0.00"}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {payments?.length || 0} total payments
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading payments...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Gardener</TableHead>
                  <TableHead>Plot</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Type</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments && filteredPayments.length > 0 ? (
                  filteredPayments.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell>{getUserName(payment.userId)}</TableCell>
                      <TableCell>{getPlotNumber(payment.plotId)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <span className="capitalize">{payment.paymentType}</span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {payment.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                      No payments found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* New Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitNewPayment)} className="space-y-4">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gardener</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gardener" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users?.map((user: any) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.firstName} {user.lastName}
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
                name="plotId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plot</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select plot" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {plots?.map((plot: any) => (
                          <SelectItem key={plot.id} value={plot.id.toString()}>
                            {plot.plotNumber} ({plot.size})
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="paymentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional payment notes..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            
              <DialogFooter>
                <Button type="submit" disabled={createPayment.isPending}>
                  {createPayment.isPending ? "Recording..." : "Record Payment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
