import * as nodemailer from "nodemailer";

interface EmailOptions {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const sendMail = async (
  templateId: number,
  receiverEmail: string,
  token?: string,
  name?: string,
  additionalData?: {
    roleType?: string;
    password?: string;
    projectName?: string;
    deliverableName?: string;
    contentCalendarName?: string;
    adminEmail?: string;
    clientName?: string;
    status?: string;
    projectId?: string;
    employeeMail?: string;
    employeeName?: string;
    message?: string;
    email?: string;
  }
) => {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.MAIL_PORT) || 587,
    secure: false, // use STARTTLS
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD, // your App Password
    },
  });

  transporter.verify((error, success) => {
    if (error) {
      console.error("SMTP Connection Failed:", error);
    } else {
      console.log("SMTP Server is ready to take messages");
    }
  });

  const mailOptions = emailTemplates(
    templateId,
    receiverEmail,
    token,
    name,
    additionalData
  );

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.messageId);
    return info;
  } catch (error) {
    console.error("Error occurred: " + error);
    return error;
  }
};

function emailTemplates(
  templateId: number,
  receiverEmail: string,
  token?: string,
  name?: string,
  additionalData?: {
    roleType?: string;
    password?: string;
    projectName?: string;
    deliverableName?: string;
    contentCalendarName?: string;
    adminEmail?: string;
    clientName?: string;
    status?: string;
    projectId?: string;
    employeeMail?: string;
    employeeName?: string;
    message?: string;
    email?: string;
  }
): EmailOptions {
  var emailOptions: EmailOptions = {
    from: "",
    to: "",
    subject: "",
    text: "",
  };

  console.log(receiverEmail, "Comming Receiver");
  //signup
  if (templateId == 1) {
    //const verificationLink = `http://${process.env.APP_URL}/users/${receiverEmail}/${token}`;
    emailOptions = {
      from: process.env.MAIL_FROM_ADDRESS || "mianmather249@gmail.com",
      to: receiverEmail, //receiverEmail,
      subject: "Email Verification - Action Required",
      text: `Hi ${name}, Thank you for signing up on ACCU.CHEK. To complete your registration and verify your email. 
            Please use the following token on our app:${token}`,
    };
  }

  //forgot password
  if (templateId == 2) {
    //const resetLink = `http://${process.env.APP_URL}/ForgotPassword.html?email=${receiverEmail}&verificationToken=${token}`;
    emailOptions = {
      from: process.env.MAIL_FROM_ADDRESS || "mianmather249@gmail.com",
      to: receiverEmail,
      subject: "Password Reset Token",
      text: `Hi ${name},

                We have received your request to reset your account password. Please use the following token to reset your password:

                Token: ${token}

                If you did not request a password reset, please ignore this message. Your account remains secure.

                Thank you,  

                Crownity`,
    };
  }

  ///password update successfully
  if (templateId == 3) {
    emailOptions = {
      from: process.env.MAIL_FROM_ADDRESS || "mianmather249@gmail.com",
      to: receiverEmail,
      subject: "Your Password Has Been Successfully Updated",

      text: `Hi ${name},

            We wanted to let you know that your password has been successfully updated. You can now log in using your new password.

            If you did not make this change, please contact our support team immediately.

            Thank you,  

            Pronostic`,
    };
  }

  //Contact Us
  if (templateId == 4) {
    emailOptions = {
      from: process.env.MAIL_FROM_ADDRESS || "mianmather249@gmail.com",
      to: receiverEmail,
      subject: "New Contact Us Submission",
      text: `You've received a new contact message from ${name}`,
      html: `
      <div id="mail" style="width: 100%; font-family: Arial, sans-serif; color: #333; padding: 20px;">
     <h2 style="text-align: center; font-weight: normal; color: #222;">📬 New Contact Message Received</h2>

        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${additionalData?.email}</p>

        <div style="margin-top: 25px;">
          <p style="font-weight: bold; margin-bottom: 10px;">Message:</p>
          <div style="padding: 10px 0; border-top: 1px solid #ccc; white-space: pre-wrap; color: #444; line-height: 1.6;">
            ${additionalData?.message}
          </div>
        </div>

        <div style="margin-top: 40px; font-size: 14px; color: #666;">
          <p>Regards,</p>
          <p><strong>Pronostic</strong></p>
        </div>
      </div>
    `,
    };
  }

  //User Added

  return emailOptions;
}


// import nodemailer from "nodemailer";

export const accountMail = async (
  email: string,
  subject: string,
  text: string
): Promise<void> => {
  try {
    const transport = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // SSL for port 465
      auth: {
        user: process.env.MAIL_USERNAME as string,
        pass: process.env.MAIL_PASSWORD as string,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_USERNAME as string,
      to: email,
      subject,
      html: text,
    };

    await transport.sendMail(mailOptions);
    console.log("Email Sent Successfully");
  } catch (error) {
    console.error("Email Not Sent", error);
    throw new Error("Email Not Sent");
  }
};
