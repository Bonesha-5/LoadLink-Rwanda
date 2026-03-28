import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// send email using a templates
export const sendEmail = async (to, subject, templateName, data) => {
  try {
    const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.html`);
    let html = await fs.readFile(templatePath, 'utf-8');

    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, data[key]);
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'LoadLink Rwanda <noreply@loadlink.rw>',
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('[EmailService] Error sending email:', error.message);
    return null;
  }
};
