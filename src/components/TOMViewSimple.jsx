import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { 
  CheckCircle2, Circle, ArrowRight, ArrowLeft, Wrench,
  Copy, Check, Eye, FileText, AlertTriangle
} from 'lucide-react'

// TOM View with MCP Prompts (No Automation Attempts)
export function TOMViewSimple({ answers, onBack, onNext }) {
  const [completedSteps, setCompletedSteps] = useState({})
  const [errorFlags, setErrorFlags] = useState({})
  const [copiedPrompt, setCopiedPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(null)

  const setupSteps = [
    {
      id: 1,
      name: 'Create GHL Contact',
      mcpPrompt: `Create a new contact in GoHighLevel with the following details:
- First Name: ${answers.name?.split(' ')[0] || ''}
- Last Name: ${answers.name?.split(' ').slice(1).join(' ') || ''}
- Email: ${answers.email || ''}
- Phone: ${answers.phone || ''}
- Company Name: ${answers.businessName || ''}
- Source: Sales Discovery App
- Industry: ${answers.industry || ''}`,
      manualSteps: [
        'Log in to GoHighLevel',
        'Navigate to Contacts',
        'Click "+ Add Contact"',
        'Fill in all contact details from the prompt above',
        'Set Source to "Sales Discovery App"',
        'Click Save'
      ]
    },
    {
      id: 2,
      name: 'Create Opportunity/Deal',
      mcpPrompt: `Create a new opportunity in GoHighLevel for the contact "${answers.businessName}":
- Opportunity Name: ${answers.businessName} - Sales Package
- Pipeline: Sales Pipeline
- Stage: New Lead
- Monetary Value: [Total from proposal]
- Status: Open
- Contact: ${answers.name}`,
      manualSteps: [
        'Open the contact you just created',
        'Go to Opportunities tab',
        'Click "+ Add Opportunity"',
        'Fill in opportunity details from the prompt',
        'Set pipeline and stage',
        'Click Save'
      ]
    },
    {
      id: 3,
      name: 'Add Service Tags',
      mcpPrompt: `Add the following tags to the contact "${answers.name}" in GoHighLevel:
- service-appointment-booking
- service-lead-nurturing
- service-sales-pipeline
- client-status-onboarding
- urgency-${answers.urgency?.toLowerCase().replace(/[^a-z]/g, '-') || 'medium'}`,
      manualSteps: [
        'Open the contact profile',
        'Find the Tags section',
        'Click to add tags',
        'Add each tag from the prompt above',
        'Tags save automatically'
      ]
    },
    {
      id: 4,
      name: 'Create Custom Fields',
      mcpPrompt: `Create the following custom fields in GoHighLevel for tracking:
- Field: "Discovery Date" | Type: Date | Value: ${new Date().toLocaleDateString()}
- Field: "Target Customer" | Type: Text | Value: ${answers.targetCustomer || ''}
- Field: "Main Frustration" | Type: Text | Value: ${answers.mainFrustration || ''}
- Field: "Success Vision" | Type: Text | Value: ${answers.successVision || ''}
- Field: "Budget Range" | Type: Text | Value: ${answers.budget || ''}`,
      manualSteps: [
        'Go to Settings → Custom Fields',
        'Click "+ Add Custom Field"',
        'Create each field from the prompt',
        'Go back to the contact and fill in values',
        'Save changes'
      ]
    },
    {
      id: 5,
      name: 'Setup Email Templates',
      mcpPrompt: `Create email templates in GoHighLevel for ${answers.businessName}:

Template 1: Welcome Email
- Subject: Welcome to Crossover AI: X, ${answers.name?.split(' ')[0]}!
- Body: Thank you for choosing us. We're excited to help ${answers.businessName} achieve ${answers.successVision || 'your goals'}.

Template 2: Onboarding Reminder
- Subject: Your Technical Onboarding Meeting is Coming Up
- Body: Hi ${answers.name?.split(' ')[0]}, we're preparing for your TOM session. Please have your assets ready.

Template 3: Follow-Up
- Subject: How are things going with your new automation?
- Body: Checking in to see how the new systems are working for ${answers.businessName}.`,
      manualSteps: [
        'Go to Marketing → Templates → Email',
        'Click "+ New Template"',
        'Create each template from the prompts',
        'Save and activate each template'
      ]
    },
    {
      id: 6,
      name: 'Configure SMS Templates',
      mcpPrompt: `Create SMS templates in GoHighLevel for ${answers.businessName}:

Template 1: Appointment Confirmation
"Hi ${answers.name?.split(' ')[0]}, your appointment is confirmed for [DATE] at [TIME]. Reply YES to confirm."

Template 2: Reminder (24h before)
"Reminder: Your appointment with Crossover AI: X is tomorrow at [TIME]. See you then!"

Template 3: Follow-Up
"Hi ${answers.name?.split(' ')[0]}, how did everything go? Reply with any questions!"`,
      manualSteps: [
        'Go to Marketing → Templates → SMS',
        'Click "+ New Template"',
        'Create each SMS template',
        'Save and activate'
      ]
    },
    {
      id: 7,
      name: 'Create Appointment Calendar',
      mcpPrompt: `Create a calendar in GoHighLevel for Technical Onboarding Meetings:
- Calendar Name: TOM - Technical Onboarding
- Duration: 60 minutes
- Buffer Time: 15 minutes before/after
- Availability: Monday-Friday, 9 AM - 5 PM
- Meeting Type: Zoom/Google Meet
- Assign to: [Your Name]
- Send confirmation email: Yes
- Send reminder: 24 hours before`,
      manualSteps: [
        'Go to Calendars',
        'Click "+ New Calendar"',
        'Fill in details from the prompt',
        'Set availability hours',
        'Configure notifications',
        'Save calendar'
      ]
    },
    {
      id: 8,
      name: 'Setup Booking Widget',
      mcpPrompt: `Create a booking widget for the TOM calendar:
- Widget Name: TOM Booking - ${answers.businessName}
- Calendar: TOM - Technical Onboarding
- Show: Available times for next 14 days
- Require: Name, Email, Phone
- Custom Question: "What's your biggest priority for this onboarding?"
- Confirmation Page: "Thank you! We'll see you at your TOM session."`,
      manualSteps: [
        'Go to Calendars → Widgets',
        'Click "+ New Widget"',
        'Select the TOM calendar',
        'Configure fields and questions',
        'Customize confirmation message',
        'Copy embed code'
      ]
    },
    {
      id: 9,
      name: 'Configure Lead Pipeline',
      mcpPrompt: `Setup the sales pipeline stages in GoHighLevel:
- Pipeline Name: ${answers.industry || 'Professional Services'} Sales
- Stages:
  1. New Lead
  2. Discovery Complete
  3. Proposal Sent
  4. Negotiation
  5. Closed Won
  6. Onboarding
  7. Active Client
- Automation: Move to "Discovery Complete" when proposal is generated`,
      manualSteps: [
        'Go to Opportunities → Pipelines',
        'Click "+ New Pipeline"',
        'Add each stage from the prompt',
        'Set up stage automations',
        'Save pipeline'
      ]
    },
    {
      id: 10,
      name: 'Setup Automation Workflows',
      mcpPrompt: `Create automation workflows in GoHighLevel for ${answers.businessName}:

Workflow 1: New Lead Nurture
- Trigger: Tag added "service-lead-nurturing"
- Action 1: Wait 5 minutes
- Action 2: Send welcome email
- Action 3: Wait 2 days
- Action 4: Send follow-up SMS
- Action 5: Wait 3 days
- Action 6: Send value email

Workflow 2: Appointment Reminders
- Trigger: Appointment booked
- Action 1: Send confirmation email immediately
- Action 2: Wait until 24 hours before
- Action 3: Send SMS reminder
- Action 4: Wait until 1 hour before
- Action 5: Send final SMS reminder`,
      manualSteps: [
        'Go to Automation → Workflows',
        'Click "+ New Workflow"',
        'Build each workflow from the prompts',
        'Test the workflow',
        'Activate when ready'
      ]
    },
    {
      id: 12,
      name: 'Setup Review Request Automation',
      mcpPrompt: `Create review request automation in GoHighLevel:
- Trigger: Tag added "service-automated-reviews"
- Wait: 7 days after service completion
- Send SMS: "Hi ${answers.name?.split(' ')[0]}, we'd love your feedback! Please leave us a review: [REVIEW_LINK]"
- Wait: 3 days
- If no review: Send email reminder
- If review received: Send thank you message`,
      manualSteps: [
        'Go to Automation → Workflows',
        'Create "Review Request" workflow',
        'Add trigger and wait conditions',
        'Add SMS and email actions',
        'Set up conditional logic',
        'Activate workflow'
      ]
    },
    {
      id: 13,
      name: 'Create Welcome Email Sequence',
      mcpPrompt: `Build a welcome email sequence for ${answers.businessName}:

Email 1 (Day 0): Welcome & Introduction
- Subject: Welcome to Crossover AI: X!
- Introduce team, set expectations, share onboarding timeline

Email 2 (Day 2): Getting Started Guide
- Subject: Your Quick Start Guide
- Share resources, tutorials, support contact

Email 3 (Day 5): Check-In
- Subject: How's everything going?
- Ask for feedback, offer help, schedule call if needed

Email 4 (Day 10): Tips & Best Practices
- Subject: Pro Tips for ${answers.industry || 'Your Industry'}
- Share industry-specific tips, case studies

Email 5 (Day 14): Review & Next Steps
- Subject: Let's Review Your Progress
- Request review, discuss expansion opportunities`,
      manualSteps: [
        'Go to Marketing → Campaigns',
        'Create "Welcome Sequence" campaign',
        'Add each email from the prompts',
        'Set delays between emails',
        'Activate sequence'
      ]
    },
    {
      id: 15,
      name: 'Final Testing & Validation',
      mcpPrompt: `Run final tests on all systems for ${answers.businessName}:

Test 1: Create a test contact and verify:
- Contact created successfully
- Tags applied correctly
- Custom fields populated
- Opportunity created

Test 2: Test automation workflows:
- Trigger welcome sequence
- Book test appointment
- Verify reminders sent

Test 3: Test AI Receptionist:
- Call the business number
- Ask common questions
- Verify responses

Test 4: Test booking widget:
- Open booking page
- Book test appointment
- Verify confirmation

Generate test report with any issues found.`,
      manualSteps: [
        'Create test contact',
        'Trigger each automation',
        'Test all integrations',
        'Verify emails/SMS sent',
        'Document any issues',
        'Fix issues and retest'
      ]
    }
  ]

  const copyPrompt = (stepId, prompt) => {
    navigator.clipboard.writeText(prompt)
    setCopiedPrompt(stepId)
    setTimeout(() => setCopiedPrompt(null), 2000)
  }

  const toggleComplete = (stepId) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }))
    // Clear error flag when marking as complete
    if (!completedSteps[stepId]) {
      setErrorFlags(prev => ({
        ...prev,
        [stepId]: false
      }))
    }
  }

  const toggleError = (stepId) => {
    setErrorFlags(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }))
  }

  const calculateProgress = () => {
    const completed = Object.values(completedSteps).filter(Boolean).length
    return (completed / setupSteps.length) * 100
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-6xl mx-auto py-8">
        <div className="text-center mb-8">
          <Wrench className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Technical Onboarding Meeting (TOM)</h1>
          <p className="text-gray-600">Step-by-step setup with MCP prompts</p>
        </div>

        {/* Overall Progress */}
        <Card className="shadow-xl mb-6">
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
            <CardDescription>{Math.round(calculateProgress())}% Complete</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>{Object.values(completedSteps).filter(Boolean).length} / {setupSteps.length} steps completed</span>
            </div>
          </CardContent>
        </Card>

        {/* Setup Steps */}
        <div className="space-y-4 mb-6">
          {setupSteps.map((step, idx) => (
            <Card key={step.id} className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer"
                      onClick={() => toggleComplete(step.id)}
                      title="Mark as complete"
                    >
                      {completedSteps[step.id] ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div 
                      className="w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer"
                      onClick={() => toggleError(step.id)}
                      title="Flag as error/needs attention"
                    >
                      {errorFlags[step.id] ? (
                        <AlertTriangle className="w-6 h-6 text-red-600 fill-red-100" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {idx + 1}. {step.name}
                      </CardTitle>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyPrompt(step.id, step.mcpPrompt)}
                    >
                      {copiedPrompt === step.id ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copy MCP Prompt
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPrompt(showPrompt === step.id ? null : step.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {showPrompt === step.id ? 'Hide' : 'View'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {showPrompt === step.id && (
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      MCP Prompt (Copy this and paste into your MCP interface)
                    </h4>
                    <Textarea
                      value={step.mcpPrompt}
                      readOnly
                      rows={8}
                      className="font-mono text-sm bg-gray-50"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Manual Steps (if MCP doesn't work)</h4>
                    <ol className="list-decimal list-inside space-y-1 text-gray-700 text-sm">
                      {step.manualSteps.map((manualStep, i) => (
                        <li key={i}>{manualStep}</li>
                      ))}
                    </ol>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assets
          </Button>
          <Button 
            onClick={onNext} 
            disabled={calculateProgress() < 100}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Continue to Implementation
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}

