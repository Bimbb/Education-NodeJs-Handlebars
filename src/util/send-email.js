const nodemailer = require("nodemailer");

module.exports = {
    sendEmail: async ({ to, subject, text }) => {
        try {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                host: process.env.EMAIL_HOST,
                port: Number(process.env.EMAIL_PORT),
                secure: true,
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD,
                },
            });

            let info = await transporter.sendMail({
                from: process.env.EMAIL_FROM_ADDRESS,
                to,
                subject,
                text,
            });
            console.log(
                `Message preview URL: ${nodemailer.getTestMessageUrl(info)}`
            );
        } catch (error) {
            console.log(error);
        }
    },
};
