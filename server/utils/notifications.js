import nodemailer from "nodemailer";
import twilio from "twilio";

const createMailTransport = () => {
  if (!process.env.SMTP_HOST) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendEmailOtp = async (email, otp) => {
  const transport = createMailTransport();

  if (!transport) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`Development email OTP for ${email}: ${otp}`);
      return;
    }
    throw new Error("Email service is not configured");
  }

  await transport.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: "YourTube login verification code",
    text: `Your verification code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your YourTube verification code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
  });
};

export const sendSmsOtp = async (phone, otp) => {
  if (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_PHONE_NUMBER
  ) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`Development SMS OTP for ${phone}: ${otp}`);
      return;
    }
    throw new Error("SMS service is not configured");
  }

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  await client.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
    body: `Your YourTube verification code is ${otp}. It expires in 10 minutes.`,
  });
};

export const sendInvoiceEmail = async ({ user, payment, plan, invoice }) => {
  const transport = createMailTransport();

  if (!transport) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`Development invoice email skipped for ${user.email}`);
      return;
    }
    throw new Error("Email service is not configured");
  }

  await transport.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: user.email,
    subject: `YourTube ${plan.name} plan payment confirmation`,
    text: `Payment successful. Plan: ${plan.name}. Amount: ₹${plan.amount}. Invoice: ${payment.invoiceNumber}.`,
    html: `<h2>Payment successful</h2><p>Your <strong>${plan.name}</strong> plan is active.</p><p>Amount paid: <strong>₹${plan.amount}</strong></p><p>Invoice: ${payment.invoiceNumber}</p>`,
    attachments: [
      {
        filename: `${payment.invoiceNumber}.pdf`,
        content: invoice,
        contentType: "application/pdf",
      },
    ],
  });
};
