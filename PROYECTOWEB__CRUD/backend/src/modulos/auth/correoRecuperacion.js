import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config(); // ← lee .env

const correo = process.env.SMTP_EMAIL;
const password = process.env.SMTP_PASSWORD;

async function enviarCorreoRecuperacion(destinatario, codigo) {
  try {
    const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
    },
    });

    const mailOptions = {
      from: `"Soporte Municipal" <${correo}>`,
      to: destinatario,
      subject: 'Código de recuperación de contraseña',
      html: `<p>Tu código de recuperación es: <b>${codigo}</b></p><p>Este código expirará en 10 minutos.</p>`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Correo enviado exitosamente a ${destinatario}`);
  } catch (error) {
    console.error('Error al enviar correo:', error);
    throw new Error('Error al enviar el correo de recuperación');
  }
}

export default enviarCorreoRecuperacion;