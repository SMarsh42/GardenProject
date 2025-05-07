import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Link } from "wouter";

export default function GardenerPayments() {
  const { user, isLoading: isAuthLoading } = useAuth();

  const { data: payments, isLoading: isPaymentsLoading } = useQuery({
    queryKey: ["/api/payments"],
    queryFn: async () => {
      const res = await fetch("/api/payments", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch payments");
      return res.json();
    },
    enabled: !!user
  });

  // Show loading state while either auth or payments are loading
  const isLoading = isAuthLoading || isPaymentsLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600">Please log in to view your payments.</p>
      </div>
    );
  }

  if (user.role !== "gardener") {
    return (
      <div className="max-w-4xl mx-auto mt-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Access Denied</h2>
        <p className="mb-4">You don't have permission to view this page.</p>
        <Button asChild>
          <Link href="/">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const gardenerPayments = payments?.filter((p: any) => p.userId === user.id) || [];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6">My Payments</h1>

      {gardenerPayments.length === 0 ? (
        <div className="text-gray-500 text-center">No payments found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gardenerPayments.map((payment: any) => (
            <Card key={payment.id}>
              <CardHeader>
                <CardTitle>Plot #{payment.plotId}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Amount:</strong> {formatCurrency(payment.amount / 100)}</p>
                <p><strong>Status:</strong> {payment.status}</p>
                <p><strong>Due Date:</strong> {formatDate(payment.dueDate)}</p>
                {payment.paidDate && (
                  <p><strong>Paid Date:</strong> {formatDate(payment.paidDate)}</p>
                )}
                <Button className="w-full mt-4" disabled={payment.status === 'paid'}>
                  Submit Payment
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
