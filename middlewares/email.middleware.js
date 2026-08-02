import nodemailer from 'nodemailer';

let transporter = null;

/**
 * إنشاء وإعادة استخدام Transporter موحد مع إعدادات الحماية والمهل الزمنية
 */
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT, 10) || 465,
      secure: (process.env.EMAIL_PORT || '465') === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      // مهل زمنية لمنع تعلق العمليات عند وجود مشكلة في الشبكة
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });
  }
  return transporter;
};

/**
 * دالة إرسال البريد الإلكتروني
 * @param {Object} options - خيارات البريد
 * @param {string} options.email - البريد الإلكتروني للمستلم
 * @param {string} options.subject - عنوان الرسالة
 * @param {string} [options.message] - نص الرسالة العادي
 * @param {string} [options.html] - محتوى الرسالة بترميز HTML
 * @param {Array} [options.attachments] - مرفقات مع الرسالة (اختياري)
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendEmail = async (options = {}) => {
  // 1. التحقق المبكر من صحة المدخلات (Input Validation)
  if (!options.email) {
    console.error('Email Error: Destination email is required.');
    return { success: false, error: 'Destination email is required' };
  }

  if (!options.subject) {
    console.error('Email Error: Subject is required.');
    return { success: false, error: 'Subject is required' };
  }

  if (!options.html && !options.message) {
    console.error('Email Error: Content (html or message) is required.');
    return { success: false, error: 'Message content is required' };
  }

  try {
    const mailer = getTransporter();

    // 2. بناء كائن البريد مع دعم النص والـ HTML والمرفقات
    const mailOptions = {
      from: `Mirvory <${process.env.EMAIL_USER || 'noreply@mirvory.com'}>`,
      to: options.email,
      subject: options.subject,
      text: options.message || undefined,
      html: options.html || undefined,
      attachments: options.attachments || [],
    };

    const info = await mailer.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    // 3. تسجيل معلومات الخطأ التفصيلية في الـ Logs
    console.error('Email Sending Failed:', {
      message: error.message,
      code: error.code,
      command: error.command,
    });
    return { success: false, error: error.message };
  }
};

export default sendEmail;
