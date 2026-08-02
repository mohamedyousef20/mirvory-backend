import { Resend } from 'resend';

// تهيئة عميل Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * دالة إرسال البريد الإلكتروني عبر Resend API
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
    // 2. بناء كائن البريد والإرسال عبر API
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Mirvory <onboarding@resend.dev>',
      to: [options.email],
      subject: options.subject,
      text: options.message || undefined,
      html: options.html || undefined,
      attachments: options.attachments || undefined,
    });

    // 3. التعامل مع أخطاء الاستجابة القادمة من Resend
    if (error) {
      console.error('Email Error Details (Resend API):', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data.id };
  } catch (error) {
    // 4. تسجيل معلومات الخطأ التفصيلية في حالة حدوث Exception غير متوقع
    console.error('Email Error Details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    return { success: false, error: error.message };
  }
};

export default sendEmail;
