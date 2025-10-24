// Email Content Generator using OpenAI API
// Fallback when MCP fails

export async function generateEmailContent(emailType, businessInfo) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert email copywriter for small businesses. Write professional, friendly, and effective email templates.'
          },
          {
            role: 'user',
            content: getEmailPrompt(emailType, businessInfo)
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      throw new Error('Failed to generate email content')
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error('Email generation error:', error)
    return getFallbackEmail(emailType, businessInfo)
  }
}

function getEmailPrompt(emailType, businessInfo) {
  const { businessName, industry, name } = businessInfo

  const prompts = {
    welcome: `Write a warm welcome email for ${businessName}, a ${industry} business. The email should:
- Thank the customer for choosing them
- Briefly introduce what they can expect
- Provide contact information
- Be friendly and professional
Keep it under 150 words.`,

    onboarding: `Write an onboarding email for ${businessName} that:
- Welcomes new clients
- Outlines the next steps
- Sets expectations
- Provides support contact
Keep it under 150 words.`,

    followup: `Write a follow-up email for ${businessName} that:
- Checks in on the customer
- Asks if they need any help
- Offers additional services
- Maintains the relationship
Keep it under 150 words.`,

    nurture: `Write a nurture email for ${businessName} that:
- Provides value to prospects
- Educates about services
- Builds trust
- Includes a soft call-to-action
Keep it under 150 words.`,

    review: `Write a review request email for ${businessName} that:
- Thanks the customer for their business
- Politely asks for a review
- Makes it easy with a direct link
- Expresses appreciation
Keep it under 100 words.`
  }

  return prompts[emailType] || prompts.welcome
}

function getFallbackEmail(emailType, businessInfo) {
  const { businessName, name } = businessInfo

  const fallbacks = {
    welcome: `Subject: Welcome to ${businessName}!

Hi ${name},

Thank you for choosing ${businessName}! We're excited to have you with us.

Over the coming days, we'll be reaching out to ensure everything is set up perfectly for you. If you have any questions in the meantime, please don't hesitate to reach out.

We're here to help you succeed!

Best regards,
The ${businessName} Team`,

    onboarding: `Subject: Let's Get Started!

Hi ${name},

Welcome aboard! We're thrilled to begin working with you.

Here's what happens next:
1. We'll schedule your onboarding call
2. Set up your account and systems
3. Begin implementation

You'll receive a calendar invite shortly. In the meantime, feel free to reply to this email with any questions.

Looking forward to working together!

Best,
The ${businessName} Team`,

    followup: `Subject: Checking In

Hi ${name},

I wanted to check in and see how everything is going with ${businessName}.

Do you have any questions or need any assistance? We're here to help ensure you're getting the most value from our services.

Feel free to reply to this email or give us a call anytime.

Best regards,
The ${businessName} Team`,

    nurture: `Subject: Quick Tip for Your Business

Hi ${name},

We wanted to share a quick insight that might help your business:

[TIP: Insert relevant industry tip or insight here]

This is just one of the many ways ${businessName} helps businesses like yours succeed. If you'd like to learn more about how we can help, just reply to this email.

Best,
The ${businessName} Team`,

    review: `Subject: We'd Love Your Feedback!

Hi ${name},

Thank you for choosing ${businessName}! We hope you've had a great experience.

If you have a moment, we'd really appreciate it if you could leave us a review. Your feedback helps us improve and helps other businesses find us.

[REVIEW LINK]

Thank you so much!

The ${businessName} Team`
  }

  return fallbacks[emailType] || fallbacks.welcome
}

// Generate multiple emails at once
export async function generateEmailSequence(emailTypes, businessInfo) {
  const emails = {}
  
  for (const type of emailTypes) {
    emails[type] = await generateEmailContent(type, businessInfo)
  }
  
  return emails
}

