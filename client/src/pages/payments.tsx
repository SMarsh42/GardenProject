import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import jsPDF from "jspdf";  
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns"; // 📅
import { Link } from "wouter";


function downloadReceipt(payment: Payment, userName: string, plotNumber: string) {
  const doc = new jsPDF();

  const amountFormatted = formatCurrency(payment.amount / 100);

  doc.setFontSize(18);
  doc.text("Community Garden Payment Receipt", 105, 20, { align: "center" });

  doc.setLineWidth(0.5);
  doc.line(20, 25, 190, 25); 

  doc.setFontSize(12);
  let y = 40;

  doc.text(`Receipt ID: ${payment.id}`, 20, y);
  y += 10;
  doc.text(`Gardener: ${userName}`, 20, y);
  y += 10;
  doc.text(`Plot Number: ${plotNumber}`, 20, y);
  y += 10;
  doc.text(`Amount Paid: ${amountFormatted}`, 20, y);
  y += 10;
  doc.text(`Payment Status: ${payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}`, 20, y);
  y += 10;
  doc.text(`Due Date: ${formatDate(payment.dueDate)}`, 20, y);
  y += 10;
  doc.text(`Paid Date: ${payment.paidDate ? formatDate(payment.paidDate) : "Not Paid Yet"}`, 20, y);

  if (payment.notes) {
    y += 10;
    doc.text(`Notes: ${payment.notes}`, 20, y);
  }


  doc.setFontSize(10);
  doc.text("Thank you for being part of our community garden!", 105, 280, { align: "center" });

  doc.save(`payment_receipt_${payment.id}.pdf`);
}




function exportPaymentsToCSV(payments: Payment[], users?: User[], plots?: Plot[]) {
  if (!payments || payments.length === 0) {
    alert("No payments to export");
    return;
  }


  const getUserName = (userId: number): string => {
    const user = users?.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : `User #${userId}`;
  };

  const getPlotNumber = (plotId: number): string => {
    const plot = plots?.find(p => p.id === plotId);
    return plot ? plot.plotNumber : `Plot #${plotId}`;
  };

  const headers = ["Payment ID", "Due Date", "Paid Date", "Gardener", "Plot", "Amount", "Status", "Notes"];

  const rows = payments.map(payment => [
    payment.id.toString(),
    new Date(payment.dueDate).toLocaleDateString(),
    payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : "-",
    getUserName(payment.userId),
    getPlotNumber(payment.plotId),
    (payment.amount / 100).toFixed(2),
    payment.status,
    payment.notes || "-",
  ]);

  const csvContent = [headers, ...rows]
    .map(e => e.map(a => `"${a}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });


  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
  const filename = `garden_payments_${today}.csv`;

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

interface Payment {
  id: number;
  userId: number;
  plotId: number;
  amount: number;
  status: string;
  dueDate: string;
  paidDate: string | null;
  notes: string | null;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface Plot {
  id: number;
  plotNumber: string;
  status: string;
  area: string;
  size: string;
  yearlyFee: number;
}

export default function Payments() {
  const { user } = useAuth();

  const isManager = user?.role === "manager";
  const isCommittee = user?.role === "committee";
  const isManagerOrCommittee = isManager || isCommittee;

  if (!isManagerOrCommittee) {
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

  const [activeTab, setActiveTab] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSendReminderOpen, setIsSendReminderOpen] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isManualPaymentOpen, setIsManualPaymentOpen] = useState(false);
  const [manualPaymentData, setManualPaymentData] = useState({
    userId: 0,
    amount: '',
    status: 'pending',
    dueDate: '',
    paidDate: '',
    notes: ''
  });
  const [manualPayments, setManualPayments] = useState<Payment[]>([]);

  const { data: plots, isLoading: isLoadingPlots } = useQuery<Plot[]>({
    queryKey: ['/api/plots'],
  });
  const payments: Payment[] = plots
  ?.filter(plot => plot.status === "assigned" || plot.status === "paid")
  .map((plot, index) => ({
    id: index + 1,
    userId: plot.assignedTo || 0,   
    plotId: plot.id,
    amount: plot.yearlyFee*100,          
    status: plot.status === "paid" ? "paid" : "pending",
    dueDate: new Date().toISOString(),
    paidDate: plot.status === "paid" ? new Date().toISOString() : null,
    notes: "Auto-generated payment",
  })) || [];


  const isLoadingPayments = false;


  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });



  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDetailsOpen(true);
  };

  const handleMarkAsPaid = async (payment: Payment) => {
    try {
      await apiRequest('PUT', `/api/payments/${payment.id}`, {
        status: 'paid',
        paidDate: new Date().toISOString()
      });

      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });

      toast({
        title: "Payment Marked as Paid",
        description: "The payment has been marked as paid.",
      });

      setIsDetailsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payment status.",
        variant: "destructive",
      });
    }
  };

  const handleSendReminder = (payment: Payment) => {
    setSelectedPayment(payment);
    setReminderMessage(`Dear ${getUserName(payment.userId)},\n\nThis is a friendly reminder that your payment for Plot ${getPlotNumber(payment.plotId)} is due on ${formatDate(payment.dueDate)}. The amount due is ${formatCurrency(payment.amount/100)}.\n\nPlease make your payment as soon as possible.\n\nThank you,\nCommunity Garden Management`);
    setIsSendReminderOpen(true);
  };

  const sendPaymentReminder = async () => {
    try {
      if (!selectedPayment) return;

      const recipient = users?.find(u => u.id === selectedPayment.userId);
      if (!recipient) {
        toast({
          title: "Error",
          description: "Recipient not found.",
          variant: "destructive",
        });
        return;
      }

      await apiRequest('POST', '/api/messages', {
        subject: "Payment Reminder",
        content: reminderMessage,
        recipientId: recipient.id,
        isGlobal: false
      });

      toast({
        title: "Reminder Sent",
        description: "The payment reminder has been sent successfully.",
      });

      setIsSendReminderOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send payment reminder.",
        variant: "destructive",
      });
    }
  };

  if (isLoadingPayments || isLoadingUsers || isLoadingPlots) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const allPayments = [...payments, ...manualPayments];

  const filteredPayments = allPayments?.filter(payment => {

    if (activeTab === 'all') return true;
    return payment.status === activeTab;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const getUserName = (userId: number) => {
    const userObj = users?.find(u => u.id === userId);
    return userObj ? `${userObj.firstName} ${userObj.lastName}` : "Unknown User";
  };

  const getPlotNumber = (plotId: number) => {
    const plotObj = plots?.find(p => p.id === plotId);
    return plotObj ? plotObj.plotNumber : "Unknown";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  const totalOutstanding = filteredPayments
    ?.filter(p => p.status !== 'paid')
    .reduce((sum, p) => sum + p.amount/100, 0) || 0;

  const totalPaid = filteredPayments
    ?.filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount/100, 0) || 0;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
          <p className="text-gray-600">Track and manage garden plot payments</p>
        </div>
      </div>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total Outstanding</p>
              <p className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</p>
            </div>
            <div className="bg-red-100 p-2 rounded-full">
              <span className="material-icons text-red-500">receipt_long</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total Paid</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <span className="material-icons text-green-500">paid</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Payments Due Soon</p>
              <p className="text-2xl font-bold">{filteredPayments?.filter(p => 
                p.status === 'pending' && 
                new Date(p.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              ).length || 0}</p>
            </div>
            <div className="bg-yellow-100 p-2 rounded-full">
              <span className="material-icons text-yellow-500">warning</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <CardTitle className="text-lg">Payment Records</CardTitle>
              <Button 
                onClick={() => exportPaymentsToCSV(filteredPayments || [], users, plots)} 
                variant="outline" 
                className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700 h-8 px-3"
                size="sm"
                disabled={!filteredPayments?.length}
              >
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Export to CSV
              </Button>
              <Button 
                variant="outline" 
                className="ml-4"
                onClick={() => setIsManualPaymentOpen(true)}
              >
                ➕ Add Manual Payment
              </Button>

            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="paid">Paid</TabsTrigger>
                <TabsTrigger value="overdue">Overdue</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No {activeTab === 'all' ? '' : activeTab} payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gardener</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plot</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Date</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments?.map(payment => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{getUserName(payment.userId)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{getPlotNumber(payment.plotId)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(payment.amount/100)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(payment.dueDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{payment.paidDate ? formatDate(payment.paidDate) : "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="link" className="p-0 h-auto text-primary" onClick={() => handleViewPayment(payment)}>
                          View
                        </Button>

                        {(payment.status === 'paid' || payment.status === 'pending') && (
                          <Button
                            variant="link"
                            className="p-0 h-auto text-primary ml-4"
                            onClick={() => downloadReceipt(payment, getUserName(payment.userId), getPlotNumber(payment.plotId))}
                          >
                            Download Receipt
                          </Button>
                        )}

                        {payment.status !== 'paid' && (
                          <>
                            <Button variant="link" className="p-0 h-auto text-primary ml-4" onClick={() => handleSendReminder(payment)}>
                              Reminder
                            </Button>
                            <Button variant="link" className="p-0 h-auto text-green-600 ml-4" onClick={() => handleMarkAsPaid(payment)}>
                              Mark Paid
                            </Button>
                          </>
                        )}

                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Gardener</p>
                  <p className="font-medium">{getUserName(selectedPayment.userId)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Plot</p>
                  <p className="font-medium">{getPlotNumber(selectedPayment.plotId)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium">{formatCurrency(selectedPayment.amount/100)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge className={getStatusColor(selectedPayment.status)}>
                    {selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="font-medium">{formatDate(selectedPayment.dueDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Paid Date</p>
                  <p className="font-medium">{selectedPayment.paidDate ? formatDate(selectedPayment.paidDate) : "-"}</p>
                </div>
              </div>

              {selectedPayment.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p>{selectedPayment.notes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                  Close
                </Button>
                {selectedPayment.status !== 'paid' && (
                  <>
                    <Button variant="outline" onClick={() => {
                      setIsDetailsOpen(false);
                      handleSendReminder(selectedPayment);
                    }}>
                      Send Reminder
                    </Button>
                    <Button onClick={() => handleMarkAsPaid(selectedPayment)}>
                      Mark as Paid
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Reminder Dialog */}
      <Dialog open={isSendReminderOpen} onOpenChange={setIsSendReminderOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Payment Reminder</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Recipient</p>
              <p className="font-medium">{selectedPayment ? getUserName(selectedPayment.userId) : ""}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Message</p>
              <textarea
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                className="w-full h-40 p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendReminderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendPaymentReminder}>
              Send Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isManualPaymentOpen} onOpenChange={setIsManualPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Manual Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* User dropdown */}
            <div>
              <label className="text-sm text-gray-600">User</label>
              <select 
                value={manualPaymentData.userId} 
                onChange={(e) => setManualPaymentData({...manualPaymentData, userId: Number(e.target.value)})}
                className="w-full border border-gray-300 rounded-md p-2 bg-white text-black"

              >
                <option value="">Select a User</option>
                {users?.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount input */}
            <div>
              <label className="text-sm text-gray-600">Amount (in dollars)</label>
              <input 
                type="number"
                value={manualPaymentData.amount}
                onChange={(e) => setManualPaymentData({...manualPaymentData, amount: e.target.value})}
                className="w-full border border-gray-300 rounded-md p-2 bg-white text-black"

                placeholder="e.g. 50.00"
              />
            </div>

            {/* Status dropdown */}
            <div>
              <label className="text-sm text-gray-600">Status</label>
              <select 
                value={manualPaymentData.status} 
                onChange={(e) => setManualPaymentData({...manualPaymentData, status: e.target.value})}
                className="w-full border border-gray-300 rounded-md p-2 bg-white text-black"

              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            {/* Due Date Picker */}
            <div>
              <label className="text-sm text-gray-600">Due Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {manualPaymentData.dueDate ? format(new Date(manualPaymentData.dueDate), "MM/dd/yyyy") : "Pick a due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={manualPaymentData.dueDate ? new Date(manualPaymentData.dueDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setManualPaymentData({...manualPaymentData, dueDate: date.toISOString()});
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>


            </div>

            {/* Paid Date Picker (only if status is paid) */}
            {manualPaymentData.status === "paid" && (
              <div>
                <label className="text-sm text-gray-600">Paid Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {manualPaymentData.paidDate ? format(new Date(manualPaymentData.paidDate), "MM/dd/yyyy") : "Pick a paid date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={manualPaymentData.paidDate ? new Date(manualPaymentData.paidDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setManualPaymentData({...manualPaymentData, paidDate: date.toISOString()});
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Notes Textbox */}
            <div>
              <label className="text-sm text-gray-600">Notes</label>
              <textarea
                value={manualPaymentData.notes}
                onChange={(e) => setManualPaymentData({...manualPaymentData, notes: e.target.value})}
                className="w-full border border-gray-300 rounded-md p-2 bg-white text-black"

                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsManualPaymentOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              const newPayment: Payment = {
                id: allPayments.length + 1, // 📋 use a clean incrementing id
                userId: manualPaymentData.userId,
                plotId: 1,
                amount: Math.round(Number(manualPaymentData.amount) * 100), 
                status: manualPaymentData.status,
                dueDate: new Date(manualPaymentData.dueDate).toISOString(),
                paidDate: manualPaymentData.paidDate ? new Date(manualPaymentData.paidDate).toISOString() : null,
                notes: manualPaymentData.notes || null,
              };
              setManualPayments(prev => [...prev, newPayment]);
              setManualPaymentData({
                userId: 0,
                amount: '',
                status: 'pending',
                dueDate: '',
                paidDate: '',
                notes: ''
              });
              setIsManualPaymentOpen(false);
            }}>
              Save Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
