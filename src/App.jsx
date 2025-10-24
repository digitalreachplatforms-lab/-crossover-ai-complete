import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Slider } from '@/components/ui/slider.jsx'
import { 
  CheckCircle2, Circle, Download, ArrowRight, ArrowLeft, FileText, Wrench, Rocket, 
  AlertCircle, CheckSquare, Loader2, Percent, DollarSign, FileSignature, Upload,
  X, Check, Clock, AlertTriangle, RefreshCw, Eye
} from 'lucide-react'
import { ProposalViewNew } from './components/ProposalViewNew.jsx'
import { TOMViewSimple } from './components/TOMViewSimple.jsx'
import { Chatbot } from './components/Chatbot.jsx'
import { ServiceEducationModal, ServiceInfoButton } from './components/ServiceEducationModal.jsx'
import { getServiceEducation, getRemovalWarning } from './serviceEducation.js'
import './App.css'

// Ohio sales tax rate
const OHIO_TAX_RATE = 0.0575 // 5.75%

function App() {
    const [selectedServices, setSelectedServices] = useState([])
  const [allServices, setAllServices] = useState([])
  
  const [currentStage, setCurrentStage] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showPackage, setShowPackage] = useState(false)
  const [currentFlow, setCurrentFlow] = useState('discovery') // 'discovery', 'proposal', 'tom', 'implementation'

  // Conversation stages
  const stages = [
    { id: 0, title: "Discovery & Rapport", icon: "👋" },
    { id: 1, title: "Diagnostic", icon: "🔍" },
    { id: 2, title: "Desired Outcomes", icon: "🎯" },
    { id: 3, title: "Resources & Constraints", icon: "💰" },
    { id: 4, title: "Solution Mapping", icon: "🛠️" },
    { id: 5, title: "Objections", icon: "💬" },
    { id: 6, title: "Commitment", icon: "✅" },
    { id: 7, title: "Follow-Up", icon: "📧" }
  ]

  // All questions organized by stage - WITH DROPDOWNS
  const questions = [
    // Stage 0: Discovery & Rapport
    [
      { 
        id: 'name', 
        type: 'select', 
        label: "What's your name?", 
        required: true,
        options: ['John Smith', 'Jane Doe', 'Michael Johnson', 'Sarah Williams', 'David Brown', 'Emily Davis', 'Other (type below)'],
        allowCustom: true
      },
      { id: 'email', type: 'email', label: "What's your best email address?", required: true },
      { id: 'phone', type: 'tel', label: "What's your phone number?", required: true },
      { 
        id: 'businessName', 
        type: 'select', 
        label: "What's your business name?", 
        required: true,
        options: ['ABC Consulting', 'XYZ Services', 'Premier Solutions', 'Elite Group', 'Pro Services', 'Other (type below)'],
        allowCustom: true
      },
      { 
        id: 'role', 
        type: 'select', 
        label: "What's your role or title?", 
        required: true,
        options: ['Owner', 'CEO', 'Managing Director', 'Operations Manager', 'Sales Manager', 'Marketing Manager', 'Other']
      },
      { 
        id: 'industry', 
        type: 'select', 
        label: "What type of business or industry are you in?", 
        required: true,
        options: [
          'Professional Services (Consulting, Legal, Accounting)',
          'Healthcare & Wellness',
          'Real Estate',
          'Home Services (Plumbing, HVAC, Contractors)',
          'Retail & E-commerce',
          'Fitness & Coaching',
          'Beauty & Spa',
          'Financial Services',
          'Technology & IT Services',
          'Other'
        ]
      },
      { 
        id: 'targetCustomer', 
        type: 'select', 
        label: "Who's your target customer or ideal client?", 
        required: true,
        options: [
          'Small business owners',
          'Enterprise/Corporate clients',
          'Individual consumers',
          'Healthcare professionals',
          'Real estate agents/investors',
          'Homeowners',
          'Other businesses (B2B)',
          'Other'
        ]
      },
      { 
        id: 'hasWebsite', 
        type: 'radio', 
        label: "Do you currently have a website?", 
        required: true,
        options: ['Yes, and it works well', 'Yes, but it needs improvement', 'No, I need a new website', 'No, but I\'m not sure if I need one']
      },
      { 
        id: 'websiteInterest', 
        type: 'radio', 
        label: "Are you interested in a new website, sales funnel, or landing page?", 
        required: true,
        options: ['Yes, I need a complete website', 'Yes, I need a sales funnel with payment processing', 'Yes, I need a simple landing page', 'No, not at this time']
      },
      { 
        id: 'hasDomain', 
        type: 'radio', 
        label: "Do you have a domain name (e.g., yourbusiness.com)?", 
        required: true,
        options: ['Yes, I own a domain', 'No, I need help getting one', 'Not sure / Need guidance']
      },
    ],
    // Stage 1: Diagnostic
    [
      { 
        id: 'mainFrustration', 
        type: 'select', 
        label: "What's the biggest frustration or bottleneck in your business right now?", 
        required: true,
        options: [
          'Not enough leads coming in',
          'Leads not converting to customers',
          'Too much manual work/no automation',
          'Poor follow-up with prospects',
          'Missed calls and opportunities',
          'Inconsistent revenue',
          'Can\'t scale the business',
          'Other'
        ]
      },
      { 
        id: 'holdingBack', 
        type: 'select', 
        label: "What do you feel is currently holding your business back from growing faster?", 
        required: true,
        options: [
          'Lack of automation',
          'No clear sales process',
          'Limited online presence',
          'Not enough time',
          'Budget constraints',
          'Technical challenges',
          'Competition',
          'Other'
        ]
      },
      { 
        id: 'leadHandling', 
        type: 'radio', 
        label: "Are you losing potential customers because of missed calls or slow response time?", 
        options: ['Yes, frequently', 'Sometimes', 'Rarely', 'Not sure'], 
        required: true 
      },
      { 
        id: 'urgency', 
        type: 'radio', 
        label: "On a scale of 1-10, how important is it for you to fix that problem now?", 
        options: ['9-10 (Critical)', '7-8 (High)', '4-6 (Moderate)', '1-3 (Low)'], 
        required: true 
      },
      { 
        id: 'problemCost', 
        type: 'select', 
        label: "What do you think it's costing you (in time, money, or energy) to not have that problem solved?", 
        required: true,
        options: [
          'Thousands of dollars per month in lost revenue',
          'Hundreds of dollars per month',
          'Significant time (10+ hours per week)',
          'Moderate time (5-10 hours per week)',
          'High stress and burnout',
          'Missed growth opportunities',
          'Other'
        ]
      },
    ],
    // Stage 2: Desired Outcomes
    [
      { 
        id: 'successVision', 
        type: 'select', 
        label: "What would success look like for you in the next 3-6 months?", 
        required: true,
        options: [
          '2x more leads and customers',
          '50% more revenue',
          'Fully automated lead follow-up',
          'More time to focus on growth',
          'Consistent 5-star reviews',
          'Professional online presence',
          'Streamlined operations',
          'Other'
        ]
      },
      { 
        id: 'successMetrics', 
        type: 'checkbox', 
        label: "How would you measure success?", 
        options: ['More calls/inquiries', 'Higher close rate', 'More automation', 'Better online presence', 'Happier customers'], 
        required: true 
      },
      { 
        id: 'timeline', 
        type: 'radio', 
        label: "How soon would you like to see results or changes?", 
        options: ['Within 1 month', '1-3 months', '3-6 months', '6+ months'], 
        required: true 
      },
    ],
    // Stage 3: Resources & Constraints
    [
      { 
        id: 'budget', 
        type: 'radio', 
        label: "What's your comfortable investment range for solving this problem?", 
        options: ['$500 - $1,000', '$1,000 - $2,500', '$2,500 - $5,000', '$5,000+'], 
        required: true 
      },
      { 
        id: 'decisionMaker', 
        type: 'radio', 
        label: "Are you the final decision-maker for this investment?", 
        options: ['Yes, I can decide now', 'I need to involve others', 'I need approval from someone else'], 
        required: true 
      },
      { 
        id: 'timelineToDecide', 
        type: 'radio', 
        label: "How quickly would you be ready to move forward if you found a solution that fits?", 
        options: ['Today/This week', 'Within 2 weeks', 'Within a month', 'Just researching'], 
        required: true 
      },
    ],
    // Stage 4: Solution Mapping
    [
      { 
        id: 'mainNeed', 
        type: 'checkbox', 
        label: "What are your main needs? (Select all that apply)", 
        options: ['More qualified leads', 'Better conversion/follow-up', 'More automation', 'Online visibility (website/branding)', 'Customer engagement'], 
        required: true 
      },
      { 
        id: 'automationInterest', 
        type: 'checkbox', 
        label: "Which automation tools interest you most?", 
        options: ['Automated Appointment Booking', 'Lead Nurturing Email Sequences', 'Automated Review Requests', 'Social Media Lead Tracking', 'Chatbot for Website'], 
        required: true 
      },
    ],
    // Stage 5: Objections
    [
      { 
        id: 'concerns', 
        type: 'checkbox', 
        label: "Do you have any concerns before moving forward?", 
        options: ['Price/Budget', 'Timing', 'Trust/Credibility', 'Technical complexity', 'Risk (what if it doesn\'t work?)', 'No concerns'], 
        required: false 
      },
      { 
        id: 'additionalQuestions', 
        type: 'textarea', 
        label: "What questions do you have before we move forward?", 
        required: false 
      },
    ],
    // Stage 6: Commitment
    [
      { 
        id: 'readyToMove', 
        type: 'radio', 
        label: "Based on everything we've discussed, are you ready to move forward?", 
        options: ['Yes, let\'s get started today', 'Yes, but I need a proposal first', 'Maybe, I need more time to think', 'Not right now'], 
        required: true 
      },
    ],
    // Stage 7: Follow-Up
    [
      { 
        id: 'nextSteps', 
        type: 'radio', 
        label: "What would be the best next step for you?", 
        options: ['Schedule onboarding call', 'Receive detailed proposal', 'Schedule follow-up call', 'Receive more information'], 
        required: true 
      },
    ]
  ]

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleNext = () => {
    const stageQuestions = questions[currentStage]
    if (currentQuestion < stageQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else if (currentStage < stages.length - 1) {
      setCurrentStage(currentStage + 1)
      setCurrentQuestion(0)
    } else {
      setShowPackage(true)
    }
  }

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    } else if (currentStage > 0) {
      setCurrentStage(currentStage - 1)
      setCurrentQuestion(questions[currentStage - 1].length - 1)
    }
  }

  const getCurrentQuestion = () => {
    return questions[currentStage][currentQuestion]
  }

  const isCurrentQuestionAnswered = () => {
    const question = getCurrentQuestion()
    if (!question.required) return true
    const answer = answers[question.id]
    if (!answer) return false
    if (Array.isArray(answer)) return answer.length > 0
    return answer.length > 0
  }

  const calculateProgress = () => {
    let totalQuestions = 0
    let answeredQuestions = 0
    
    questions.forEach((stageQuestions, stageIndex) => {
      stageQuestions.forEach(q => {
        totalQuestions++
        const answer = answers[q.id]
        if (answer && (Array.isArray(answer) ? answer.length > 0 : answer.length > 0)) {
          answeredQuestions++
        }
      })
    })
    
    return (answeredQuestions / totalQuestions) * 100
  }

  const exportData = () => {
    const dataStr = JSON.stringify(answers, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `client-data-${answers.businessName || 'export'}.json`
    link.click()
  }

  const activateTestMode = () => {
    // Auto-populate all answers with test data
    setAnswers({
      name: 'John Smith',
      email: 'john@example.com',
      phone: '555-123-4567',
      businessName: 'Test Business Inc',
      role: 'Owner',
      industry: 'Professional Services (Consulting, Legal, Accounting)',
      targetCustomer: 'Small business owners',
      hasWebsite: 'Yes, but it needs improvement',
      websiteInterest: 'Yes, I need a sales funnel with payment processing',
      hasDomain: 'Yes, I own a domain',
      mainFrustration: 'Not enough leads coming in',
      holdingBack: 'Lack of automation',
      leadHandling: 'Yes, frequently',
      urgency: '9-10 (Critical)',
      problemCost: 'Thousands of dollars per month in lost revenue',
      successVision: '2x more leads and customers',
      successMetrics: ['More calls/inquiries', 'Higher close rate', 'More automation'],
      timeline: 'Within 1 month',
      budget: '$2,500 - $5,000',
      decisionMaker: 'Yes, I can decide now',
      timelineToDecide: 'Today/This week',
      mainNeed: ['More qualified leads', 'Better conversion/follow-up', 'More automation'],
      automationInterest: ['Automated Appointment Booking', 'Lead Nurturing Email Sequences', 'Social Media Lead Tracking'],
      concerns: ['No concerns'],
      additionalQuestions: '',
      readyToMove: "Yes, let's get started today",
      nextSteps: 'See a proposal and pricing'
    })
    // Jump to package view
    setShowPackage(true)
  }

  // Show different views based on flow
  if (currentFlow === 'proposal') {
    return <ProposalViewNew 
      selectedServices={selectedServices} 
      services={allServices} 
      answers={answers} 
      onBack={() => {
        setShowPackage(true)
        setCurrentFlow('discovery')
      }} 
      onNext={() => setCurrentFlow('assets')} 
    />
  }

  if (currentFlow === 'assets') {
    return <AssetGatheringView answers={answers} onBack={() => setCurrentFlow('proposal')} onNext={() => setCurrentFlow('tom')} />
  }

  if (currentFlow === 'tom') {
    return <TOMView answers={answers} onBack={() => setCurrentFlow('assets')} onNext={() => setCurrentFlow('implementation')} />
  }

  if (currentFlow === 'implementation') {
    return <ImplementationView answers={answers} onBack={() => setCurrentFlow('tom')} onComplete={() => alert('Implementation complete!')} />
  }

  if (showPackage) {
    return <PackageView 
      answers={answers} 
      onBack={() => setShowPackage(false)} 
      onExport={exportData}
      onContinue={(services) => {
        setSelectedServices(services)
        setCurrentFlow('proposal')
      }}
      setSelectedServicesParent={setSelectedServices}
      setAllServicesParent={setAllServices}
    />
  }

  const question = getCurrentQuestion()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <Button
            variant="outline"
            size="sm"
            onClick={activateTestMode}
            className="absolute top-0 right-0 text-xs"
          >
            🧪 Test Mode
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Crossover AI: X</h1>
          <p className="text-gray-600">Sales Discovery Navigator</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-medium text-gray-700">{Math.round(calculateProgress())}%</span>
          </div>
          <Progress value={calculateProgress()} className="h-2" />
        </div>

        {/* Stage Indicators */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-2">
            {stages.map((stage, index) => (
              <div
                key={stage.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  index === currentStage
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : index < currentStage
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <span className="text-xl">{stage.icon}</span>
                <span className="text-sm font-medium whitespace-nowrap">{stage.title}</span>
                {index < currentStage && <CheckCircle2 className="w-4 h-4" />}
              </div>
            ))}
          </div>
        </div>

        {/* Question Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-3xl">{stages[currentStage].icon}</span>
              <span>{stages[currentStage].title}</span>
            </CardTitle>
            <CardDescription>
              Question {currentQuestion + 1} of {questions[currentStage].length}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-lg font-medium mb-4 block">
                {question.label}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </Label>

              {question.type === 'select' ? (
                <div className="space-y-3">
                  <Select
                    value={answers[question.id] || ''}
                    onValueChange={(value) => handleAnswer(question.id, value)}
                  >
                    <SelectTrigger className="text-lg">
                      <SelectValue placeholder="Select an option..." />
                    </SelectTrigger>
                    <SelectContent>
                      {question.options.map((option, idx) => (
                        <SelectItem key={idx} value={option} className="text-base">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {question.allowCustom && answers[question.id]?.includes('Other') && (
                    <Input
                      type="text"
                      value={answers[`${question.id}_custom`] || ''}
                      onChange={(e) => handleAnswer(`${question.id}_custom`, e.target.value)}
                      placeholder="Please specify..."
                      className="text-lg mt-2"
                    />
                  )}
                </div>
              ) : question.type === 'text' || question.type === 'email' || question.type === 'tel' ? (
                <Input
                  type={question.type}
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswer(question.id, e.target.value)}
                  placeholder="Type your answer here..."
                  className="text-lg"
                />
              ) : question.type === 'textarea' ? (
                <Textarea
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswer(question.id, e.target.value)}
                  placeholder="Type your answer here..."
                  rows={4}
                  className="text-lg"
                />
              ) : question.type === 'radio' ? (
                <RadioGroup
                  value={answers[question.id] || ''}
                  onValueChange={(value) => handleAnswer(question.id, value)}
                >
                  {question.options.map((option, idx) => (
                    <div key={idx} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <RadioGroupItem value={option} id={`${question.id}-${idx}`} />
                      <Label htmlFor={`${question.id}-${idx}`} className="cursor-pointer flex-1 text-base">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : question.type === 'checkbox' ? (
                <div className="space-y-2">
                  {question.options.map((option, idx) => {
                    const currentAnswers = answers[question.id] || []
                    const isChecked = currentAnswers.includes(option)
                    
                    // Objection responses for concerns question
                    const objectionResponses = {
                      'Price/Budget': {
                        title: 'Investment That Pays for Itself',
                        text: 'Our automation solutions typically save businesses 15-20 hours per week and increase revenue by 25-40% within 90 days. The ROI is clear: clients often recoup their investment in the first month through increased conversions and time savings. We also offer flexible payment plans to fit your budget.'
                      },
                      'Timing': {
                        title: 'Fast Implementation, Immediate Results',
                        text: 'We understand time is money. Our streamlined onboarding process gets you up and running in 7-14 days, not months. You\'ll see immediate improvements in lead response time and automation. Plus, we handle all the technical setup—you just need to approve and go live.'
                      },
                      'Trust/Credibility': {
                        title: 'Proven Track Record & Transparency',
                        text: 'We\'ve helped 100+ businesses like yours automate and scale. Our clients see an average 35% increase in qualified leads and 40% reduction in manual work. We provide case studies, client testimonials, and transparent reporting. Plus, we\'re with you every step—this isn\'t a "set it and forget it" service.'
                      },
                      'Technical complexity': {
                        title: 'We Handle the Tech, You Focus on Business',
                        text: 'Zero technical knowledge required. We build, configure, and test everything for you. You\'ll get a simple dashboard, clear training, and 24/7 support. If you can send an email, you can use our systems. We make automation simple, not complicated.'
                      },
                      'Risk (what if it doesn\'t work?)': {
                        title: 'Results Guaranteed, Risk Minimized',
                        text: 'We stand behind our work with a 30-day satisfaction guarantee. If the automation doesn\'t work as promised, we\'ll fix it or refund you. We also provide ongoing optimization and support—we succeed when you succeed. Our systems are proven, tested, and backed by real results from businesses like yours.'
                      }
                    }
                    
                    return (
                      <div key={idx} className="space-y-2">
                        <div
                          className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => {
                            const newAnswers = isChecked
                              ? currentAnswers.filter(a => a !== option)
                              : [...currentAnswers, option]
                            handleAnswer(question.id, newAnswers)
                          }}
                        >
                          <div className="w-5 h-5 border-2 border-gray-300 rounded flex items-center justify-center">
                            {isChecked && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                          </div>
                          <Label className="cursor-pointer flex-1 text-base">{option}</Label>
                        </div>
                        
                        {/* Show objection response if this concern is selected and it's the concerns question */}
                        {isChecked && question.id === 'concerns' && objectionResponses[option] && (
                          <div className="ml-7 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                            <h4 className="font-semibold text-blue-900 mb-2">
                              ✓ {objectionResponses[option].title}
                            </h4>
                            <p className="text-sm text-blue-800">
                              {objectionResponses[option].text}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStage === 0 && currentQuestion === 0}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!isCurrentQuestionAnswered()}
                className="flex-1"
              >
                {currentStage === stages.length - 1 && currentQuestion === questions[currentStage].length - 1
                  ? 'Generate Package'
                  : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>💡 Take your time with each question. Your answers help us create the perfect solution for your business.</p>
        </div>
      </div>
      
      {/* Chatbot - Fixed to bottom-right */}
      <Chatbot />
    </div>
  )
}

// Package View Component
function PackageView({ answers, onBack, onExport, onContinue, setSelectedServicesParent, setAllServicesParent }) {
  const [selectedServices, setSelectedServices] = useState([])
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(null)
  const [educationModal, setEducationModal] = useState({ isOpen: false, service: null, education: null })

  // Service catalog with pricing and reasons
  const services = [
    { 
      id: 'w001', 
      name: 'Automated Appointment Booking', 
      setupFee: 400,
      monthlyFee: 100, 
      priority: 'high', 
      description: 'Never miss a booking opportunity',
      reason: answers.leadHandling === 'Yes, frequently' ? 'solve your problem of missed calls and slow response time' : 'automate your booking process'
    },
    { 
      id: 'w002', 
      name: 'Lead Nurturing & Education Sequence', 
      setupFee: 500,
      monthlyFee: 100, 
      priority: 'high', 
      description: 'Build trust automatically',
      reason: answers.mainFrustration?.includes('Leads not converting') ? 'improve your lead conversion rate' : 'nurture leads automatically'
    },
    { 
      id: 'w003', 
      name: 'Professional Services Sales Pipeline', 
      setupFee: 600,
      monthlyFee: 200, 
      priority: 'high', 
      description: 'Complete sales management',
      reason: answers.holdingBack?.includes('No clear sales process') ? 'establish a clear sales process' : 'manage your sales pipeline'
    },
    { 
      id: 'w004', 
      name: 'Appointment Reminder System', 
      setupFee: 250,
      monthlyFee: 50, 
      priority: 'medium', 
      description: 'Reduce no-shows',
      reason: 'reduce appointment no-shows and improve attendance'
    },
    { 
      id: 'w005', 
      name: 'Automated Review Requests', 
      setupFee: 300,
      monthlyFee: 50, 
      priority: 'medium', 
      description: 'Build your reputation',
      reason: 'build your online reputation with more reviews'
    },
    { 
      id: 'w006', 
      name: 'Proposal & Signature Automation', 
      setupFee: 350,
      monthlyFee: 100, 
      priority: 'medium', 
      description: 'Close deals faster',
      reason: 'speed up your sales closing process'
    },

    { 
      id: 'w008', 
      name: 'Referral Generation System', 
      setupFee: 300,
      monthlyFee: 100, 
      priority: 'low', 
      description: 'Grow through referrals',
      reason: 'generate more referrals from happy clients'
    },
    { 
      id: 'w009', 
      name: 'Professional Website Build', 
      setupFee: 1200,
      monthlyFee: 300, 
      priority: answers.hasWebsite?.includes('No') ? 'high' : 'low', 
      description: 'Custom website design and development',
      reason: answers.hasWebsite?.includes('No') ? 'establish your online presence with a professional website' : 'upgrade your existing website'
    },
    { 
      id: 'w010', 
      name: 'Sales Funnel with Payment Portal', 
      setupFee: 1600,
      monthlyFee: 400, 
      priority: answers.websiteInterest?.includes('sales funnel') ? 'high' : 'medium', 
      description: 'Complete funnel with payment processing',
      reason: answers.websiteInterest?.includes('payment processing') ? 'enable online payments and automate your sales funnel' : 'create a high-converting sales funnel'
    },
    { 
      id: 'w011', 
      name: 'Domain Setup & Configuration', 
      setupFee: 150,
      monthlyFee: 0, 
      priority: answers.hasDomain?.includes('No') ? 'high' : 'low', 
      description: 'Domain registration and DNS setup',
      reason: answers.hasDomain?.includes('No') ? 'get your domain name set up properly' : 'configure your existing domain'
    },
    { 
      id: 'w012', 
      name: 'Social Media Lead Tracking & Attribution', 
      setupFee: 350,
      monthlyFee: 75, 
      priority: 'medium', 
      description: 'Track which social media posts generate leads',
      reason: 'identify your best-performing social media campaigns and optimize your marketing'
    },
    { 
      id: 'w013', 
      name: 'Social Media Scheduling & Management', 
      setupFee: 400,
      monthlyFee: 150, 
      priority: 'medium', 
      description: 'Schedule posts across all your social platforms',
      reason: 'maintain consistent social media presence and save time on posting'
    },
    { 
      id: 'w014', 
      name: 'Social Media Complete Package', 
      setupFee: 650,
      monthlyFee: 200, 
      priority: 'high', 
      description: 'Lead tracking + scheduling bundle (Save $100 setup + $25/month)',
      reason: 'get complete social media automation with lead attribution and scheduled posting'
    },
    { 
      id: 'w015', 
      name: 'Basic Website Chatbot', 
      setupFee: 300,
      monthlyFee: 50, 
      priority: 'medium', 
      description: 'AI chatbot to answer common questions 24/7',
      reason: 'capture leads and answer questions even when you\'re not available'
    },
    { 
      id: 'w016', 
      name: 'Custom Chatbot Training', 
      setupFee: 500,
      monthlyFee: 100, 
      priority: 'low', 
      description: 'Train your chatbot with your specific business knowledge',
      reason: 'provide personalized responses based on your products, services, and FAQs'
    },
    { 
      id: 'rectest', 
      name: '🧪 RecTest Package', 
      setupFee: 2,
      monthlyFee: 3, 
      priority: 'test', 
      description: 'Test package for payment processing ($2 setup + $3/month recurring)',
      reason: 'test the complete payment and account creation workflow',
      isTestPackage: true,
      ghlSubAccount: 'crossoveraix',
      testMode: true,
      billingSchedule: {
        setupImmediate: true,
        recurringDelay: '24h',
        recurringAmount: 3
      }
    },
  ]

  // Set all services in parent immediately
  useEffect(() => {
    if (setAllServicesParent) setAllServicesParent(services)
  }, [setAllServicesParent])

  // Auto-select recommended services based on answers
  useEffect(() => {
    const recommended = []
    
    if (answers.budget && !answers.budget.includes('$500')) {
      recommended.push('w001', 'w002', 'w003')
    } else {
      recommended.push('w001')
    }

    if (answers.mainNeed?.includes('Better conversion/follow-up')) {
      recommended.push('w004', 'w005')
    }
    if (answers.automationInterest?.includes('AI Receptionist')) {
      recommended.push('w001')
    }
    if (answers.automationInterest?.includes('Lead Nurturing Email Sequences')) {
      recommended.push('w002')
    }
    
    // Website services
    if (answers.hasWebsite?.includes('No, I need a new website')) {
      recommended.push('w009')
    }
    if (answers.websiteInterest?.includes('sales funnel with payment processing')) {
      recommended.push('w010')
    }
    if (answers.hasDomain?.includes('No, I need help getting one')) {
      recommended.push('w011')
    }

    const uniqueRecommended = [...new Set(recommended)]
    setSelectedServices(uniqueRecommended)
    if (setSelectedServicesParent) setSelectedServicesParent(uniqueRecommended)
    if (setAllServicesParent) setAllServicesParent(services)
  }, [])

  const toggleService = (serviceId) => {
    const isCurrentlySelected = selectedServices.includes(serviceId)
    
    if (isCurrentlySelected) {
      // Show confirmation popup before removing
      setShowRemoveConfirm(serviceId)
    } else {
      // Add service without confirmation
      setSelectedServices(prev => [...prev, serviceId])
    }
  }
  
  const confirmRemove = () => {
    setSelectedServices(prev => prev.filter(id => id !== showRemoveConfirm))
    setShowRemoveConfirm(null)
  }
  
  const cancelRemove = () => {
    setShowRemoveConfirm(null)
  }

  const calculateTotals = () => {
    const setupTotal = selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId)
      return total + (service?.setupFee || 0)
    }, 0)
    
    const monthlyTotal = selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId)
      return total + (service?.monthlyFee || 0)
    }, 0)
    
    return { setupTotal, monthlyTotal }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-6xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Custom Package</h1>
          <p className="text-gray-600">Based on your needs and goals</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Client Summary */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Client Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-semibold text-gray-700">Name</p>
                <p className="text-gray-900">{answers.name}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Business</p>
                <p className="text-gray-900">{answers.businessName}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Industry</p>
                <p className="text-gray-900">{answers.industry}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Budget</p>
                <p className="text-gray-900">{answers.budget}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Urgency</p>
                <p className="text-gray-900">{answers.urgency}</p>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Select Services</h2>
                <p className="text-gray-600 mb-4">Click to add or remove services from your package</p>
              </div>
              <Button
                onClick={() => {
                  setSelectedServices(['rectest'])
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                🧪 Test Package ($2 Setup + $3/month)
              </Button>
            </div>
            
            <div className="grid gap-4">
              {services.map(service => {
                const isSelected = selectedServices.includes(service.id)
                return (
                  <Card
                    key={service.id}
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'border-blue-500 border-2 bg-blue-50' : 'hover:border-gray-400'
                    }`}
                    onClick={() => toggleService(service.id)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center">
                          {isSelected ? <CheckCircle2 className="w-5 h-5 text-blue-600" /> : <Circle className="w-5 h-5 text-gray-400" />}
                        </div>
                        <div>
                          <div className="flex items-center">
                            <h3 className="font-semibold text-gray-900">{service.name}</h3>
                            <ServiceInfoButton onClick={() => {
                              const education = getServiceEducation(service.id)
                              setEducationModal({ isOpen: true, service, education })
                            }} />
                          </div>
                          <p className="text-sm text-gray-600">{service.description}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            service.priority === 'high' ? 'bg-red-100 text-red-800' :
                            service.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {service.priority}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">${service.price}</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>

        {/* Total and Actions */}
        <Card className="shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Total Investment</h2>
                <p className="text-gray-600">One-time setup + ongoing support</p>
                <p className="text-sm text-gray-500 mt-1">{selectedServices.length} services selected</p>
              </div>
              <div className="text-right">
                <p className="text-5xl font-bold text-blue-600">${calculateTotals().setupTotal + calculateTotals().monthlyTotal}</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button variant="outline" onClick={onBack} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Questions
              </Button>
              <Button onClick={onExport} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export Client Data
              </Button>
              <Button onClick={() => { setAllServicesParent(services); onContinue(selectedServices); }} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Continue to Proposal
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Removal Confirmation Modal */}
        {showRemoveConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  Confirm Removal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-900">
                  If we remove <strong>{services.find(s => s.id === showRemoveConfirm)?.name}</strong>, 
                  you will not be able to <strong>{services.find(s => s.id === showRemoveConfirm)?.reason}</strong>.
                </p>
                <p className="text-sm text-gray-600">
                  Are you sure you want to remove this service?
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={cancelRemove} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={confirmRemove} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                    Yes, Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Education Modal */}
        <ServiceEducationModal
          service={educationModal.service}
          education={educationModal.education}
          isOpen={educationModal.isOpen}
          onClose={() => setEducationModal({ isOpen: false, service: null, education: null })}
        />
      </div>
    </div>
  )
}

// NEW: Enhanced Proposal View with Discount Slider, Tax, Signature
function ProposalView({ answers, onBack, onNext }) {
  const [discount, setDiscount] = useState(0)
  const [clientSignature, setClientSignature] = useState('')
  const [servicePriorities, setServicePriorities] = useState({})
  const [showDiscountSlider, setShowDiscountSlider] = useState(false)
  const signaturePadRef = useRef(null)
  const canvasRef = useRef(null)
  
  // Initialize signature pad
  useEffect(() => {
    if (canvasRef.current && !signaturePadRef.current) {
      import('signature_pad').then((SignaturePad) => {
        const canvas = canvasRef.current
        // Set canvas size to match display size
        const rect = canvas.getBoundingClientRect()
        canvas.width = rect.width * window.devicePixelRatio
        canvas.height = rect.height * window.devicePixelRatio
        const ctx = canvas.getContext('2d')
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
        
        signaturePadRef.current = new SignaturePad.default(canvas, {
          backgroundColor: 'rgb(255, 255, 255)',
          penColor: 'rgb(0, 0, 0)',
          minWidth: 1,
          maxWidth: 3,
        })
        
        signaturePadRef.current.addEventListener('endStroke', () => {
          setClientSignature(signaturePadRef.current.toDataURL())
        })
      })
    }
    
    return () => {
      if (signaturePadRef.current) {
        signaturePadRef.current.off()
      }
    }
  }, [])
  
  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear()
      setClientSignature('')
    }
  }
  
  // Get services from package (this would be passed from PackageView in real implementation)
  const selectedServices = [
    { id: 'w001', name: 'Automated Appointment Booking', price: 500 },
    { id: 'w002', name: 'Lead Nurturing & Education Sequence', price: 600 },
    { id: 'w003', name: 'Professional Services Sales Pipeline', price: 800 },
  ]

  const subtotal = selectedServices.reduce((sum, s) => sum + s.price, 0)
  const discountAmount = subtotal * (discount / 100)
  const afterDiscount = subtotal - discountAmount
  const taxAmount = afterDiscount * OHIO_TAX_RATE
  const total = afterDiscount + taxAmount

  const togglePriority = (serviceId) => {
    setServicePriorities(prev => ({
      ...prev,
      [serviceId]: prev[serviceId] === 'high' ? 'medium' : 'high'
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-5xl mx-auto py-8">
        <div className="text-center mb-8">
          <FileText className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Proposal</h1>
          <p className="text-gray-600">Review, adjust, and finalize your custom package</p>
        </div>

        {/* Services with Priority Toggle */}
        <Card className="shadow-xl mb-6">
          <CardHeader>
            <CardTitle>Selected Services</CardTitle>
            <CardDescription>Click priority badges to adjust for negotiation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedServices.map(service => (
              <div key={service.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                    <button
                      onClick={() => togglePriority(service.id)}
                      className={`text-xs px-2 py-1 rounded-full cursor-pointer ${
                        servicePriorities[service.id] === 'high'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {servicePriorities[service.id] || 'medium'} priority (click to toggle)
                    </button>
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900">${service.price}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Discount Slider (Hidden/Toggle) */}
        <Card className="shadow-xl mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5" />
                Discount Adjustment
                {discount > 0 && !showDiscountSlider && (
                  <span className="text-sm font-normal text-red-600">({discount}% applied)</span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDiscountSlider(!showDiscountSlider)}
              >
                {showDiscountSlider ? 'Hide Discount' : 'Apply Discount'}
              </Button>
            </CardTitle>
            {showDiscountSlider && (
              <CardDescription>Adjust discount for negotiation (0-30%)</CardDescription>
            )}
          </CardHeader>
          {showDiscountSlider && (
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Discount: {discount}%</Label>
                  <span className="text-lg font-bold text-red-600">-${discountAmount.toFixed(2)}</span>
                </div>
                <Slider
                  value={[discount]}
                  onValueChange={(value) => setDiscount(value[0])}
                  max={30}
                  step={1}
                  className="w-full"
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Pricing Breakdown */}
        <Card className="shadow-xl mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-lg">
              <span className="text-gray-700">Subtotal:</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-lg text-red-600">
                <span>Discount ({discount}%):</span>
                <span className="font-semibold">-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg">
              <span className="text-gray-700">After Discount:</span>
              <span className="font-semibold">${afterDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-gray-700">Ohio Sales Tax (5.75%):</span>
              <span className="font-semibold">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="border-t-2 border-gray-300 pt-3 flex justify-between text-2xl">
              <span className="font-bold text-gray-900">Total:</span>
              <span className="font-bold text-blue-600">${total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Client Signature */}
        <Card className="shadow-xl mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="w-5 h-5" />
              Client Signature
            </CardTitle>
            <CardDescription>Sign with your finger or stylus on the canvas below</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-gray-300 rounded-lg bg-white overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full touch-none cursor-crosshair"
                style={{ 
                  touchAction: 'none',
                  width: '100%',
                  height: '200px'
                }}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={clearSignature}
                className="flex-1"
              >
                Clear Signature
              </Button>
            </div>
            {clientSignature && (
              <p className="text-sm text-gray-600 mt-2 text-center">
                ✓ Signed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Package
          </Button>
          <Button 
            onClick={onNext} 
            disabled={!clientSignature}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Continue to Asset Gathering
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// NEW: Asset Gathering View
function AssetGatheringView({ answers, onBack, onNext }) {
  const [uploadedAssets, setUploadedAssets] = useState({})

  const assetChecklist = [
    { id: 'logo', name: 'Company Logo (PNG/SVG)', required: true },
    { id: 'brand-colors', name: 'Brand Colors/Style Guide', required: false },
    { id: 'website-access', name: 'Website Access Credentials', required: true },
    { id: 'ghl-access', name: 'GoHighLevel Login Info', required: true },
    { id: 'email-access', name: 'Business Email Access', required: false },
    { id: 'social-media', name: 'Social Media Account Info', required: false },
  ]

  const toggleAsset = (assetId) => {
    setUploadedAssets(prev => ({
      ...prev,
      [assetId]: !prev[assetId]
    }))
  }

  const requiredComplete = assetChecklist
    .filter(a => a.required)
    .every(a => uploadedAssets[a.id])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <Upload className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Asset Gathering</h1>
          <p className="text-gray-600">Collect necessary files and access credentials</p>
        </div>

        {/* Google Drive Instructions */}
        <Card className="shadow-xl mb-6">
          <CardHeader>
            <CardTitle>📁 Google Drive Upload Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Go to <a href="https://drive.google.com" target="_blank" className="text-blue-600 underline">drive.google.com</a></li>
              <li>Click "+ New" → "Folder"</li>
              <li>Name it: "{answers.businessName} - Crossover AI Assets"</li>
              <li>Upload all required files to this folder</li>
              <li>Right-click the folder → "Share" → Add: <strong>assets@completecrossoverai.com</strong></li>
              <li>Set permission to "Editor"</li>
              <li>Click "Send"</li>
            </ol>
          </CardContent>
        </Card>

        {/* Apple iCloud Instructions */}
        <Card className="shadow-xl mb-6">
          <CardHeader>
            <CardTitle>☁️ Apple iCloud Upload Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Go to <a href="https://icloud.com" target="_blank" className="text-blue-600 underline">iCloud.com</a> and sign in</li>
              <li>Click "iCloud Drive"</li>
              <li>Create a new folder: "{answers.businessName} - Assets"</li>
              <li>Upload all required files</li>
              <li>Click the share icon on the folder</li>
              <li>Add: <strong>assets@completecrossoverai.com</strong></li>
              <li>Set permission to "Can make changes"</li>
              <li>Click "Share"</li>
            </ol>
          </CardContent>
        </Card>

        {/* Asset Checklist */}
        <Card className="shadow-xl mb-6">
          <CardHeader>
            <CardTitle>✅ Asset Checklist</CardTitle>
            <CardDescription>Mark items as uploaded</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {assetChecklist.map(asset => (
              <div
                key={asset.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                onClick={() => toggleAsset(asset.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-gray-300 rounded flex items-center justify-center">
                    {uploadedAssets[asset.id] && <Check className="w-5 h-5 text-green-600" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{asset.name}</p>
                    {asset.required && <span className="text-xs text-red-600">Required</span>}
                  </div>
                </div>
                {uploadedAssets[asset.id] && (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Proposal
          </Button>
          <Button 
            onClick={onNext} 
            disabled={!requiredComplete}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Continue to TOM Setup
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Use the simple TOM view instead
function TOMView(props) {
  return <TOMViewSimple {...props} />
}

// Implementation View (unchanged)
function ImplementationView({ answers, onBack, onComplete }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <Rocket className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Implementation Stage</h1>
          <p className="text-gray-600">Service activation and go-live</p>
        </div>

        <Card className="shadow-xl mb-6">
          <CardHeader>
            <CardTitle>Implementation Checklist</CardTitle>
            <CardDescription>Track your progress to go-live</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                'Test all automation workflows',
                'Verify integrations are working',
                'Train team members on new systems',
                'Set up monitoring and alerts',
                'Schedule follow-up review call',
                'Go live with new services'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-900">{item}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={onBack} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to TOM
              </Button>
              <Button onClick={onComplete} className="flex-1 bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Complete Implementation
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Removal Confirmation Modal */}
        {showRemoveConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  Confirm Removal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-900">
                  If we remove <strong>{services.find(s => s.id === showRemoveConfirm)?.name}</strong>, 
                  you will not be able to <strong>{services.find(s => s.id === showRemoveConfirm)?.reason}</strong>.
                </p>
                <p className="text-sm text-gray-600">
                  Are you sure you want to remove this service?
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={cancelRemove} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={confirmRemove} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                    Yes, Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

