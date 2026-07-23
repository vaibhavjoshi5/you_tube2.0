import PDFDocument from "pdfkit";

export const createInvoice = ({ user, payment, plan }) =>
  new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];

    document.on("data", (chunk) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    document.fontSize(24).text("YourTube", { align: "center" });
    document.moveDown();
    document.fontSize(18).text("Payment Invoice", { align: "center" });
    document.moveDown(2);
    document.fontSize(11);
    document.text(`Invoice number: ${payment.invoiceNumber}`);
    document.text(`Payment ID: ${payment.razorpayPaymentId}`);
    document.text(`Date: ${payment.paidAt.toLocaleString("en-IN")}`);
    document.moveDown();
    document.text(`Customer: ${user.name || "YourTube user"}`);
    document.text(`Email: ${user.email}`);
    document.moveDown();
    document.fontSize(13).text(`Plan: ${plan.name}`);
    document.text(`Amount paid: ₹${plan.amount}`);
    document.text("Payment status: Paid");
    document.moveDown(2);
    document
      .fontSize(10)
      .fillColor("#555")
      .text("This invoice was generated automatically after payment verification.");
    document.end();
  });
