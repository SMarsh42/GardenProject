import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";

interface PaymentReceiptProps {
  payment: {
    id: number;
    userName: string;
    plotNumber: string;
    amount: number; // in cents
    paymentType: string;
    paymentDate: string;
    notes?: string;
  };
}

export function PaymentReceipt({ payment }: PaymentReceiptProps) {
  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Community Garden Payment Receipt", 20, 20);

    doc.setFontSize(12);
    doc.text(`Receipt ID: ${payment.id}`, 20, 40);
    doc.text(`Gardener: ${payment.userName}`, 20, 50);
    doc.text(`Plot Number: ${payment.plotNumber}`, 20, 60);
    doc.text(`Amount Paid: $${(payment.amount / 100).toFixed(2)}`, 20, 70);
    doc.text(`Payment Type: ${payment.paymentType}`, 20, 80);
    doc.text(`Payment Date: ${new Date(payment.paymentDate).toLocaleDateString()}`, 20, 90);

    if (payment.notes) {
      doc.text(`Notes: ${payment.notes}`, 20, 100);
    }

    doc.save(`PaymentReceipt-${payment.id}.pdf`);
  };

  return (
    <Button onClick={generatePDF} variant="secondary">
      Download Receipt
    </Button>
  );
}
