import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendWelcomeEmail = async ({ to, subject, firstName, lastName, email, temporaryPassword, companyName }) => {
  const mailOptions = {
    from: `"${companyName}" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Bienvenue chez ${companyName} !</h2>
        <p>Bonjour ${firstName} ${lastName},</p>
        <p>Votre compte employé a été créé avec succès.</p>
        
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Mot de passe temporaire:</strong> ${temporaryPassword}</p>
        </div>
        
        <p>Pour accéder à votre compte, veuillez vous connecter à notre plateforme :</p>
        <a href="${process.env.FRONTEND_URL}/login" 
           style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px;">
          Se connecter
        </a>
        
        <p style="margin-top: 20px; font-size: 0.9em; color: #6b7280;">
          Pour des raisons de sécurité, nous vous recommandons de changer votre mot de passe après votre première connexion.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};