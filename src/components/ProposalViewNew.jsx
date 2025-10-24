import { useState, useRef, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { Slider } from '@/components/ui/slider.jsx'
import { FileText, FileSignature, CheckCircle2, DollarSign, Download, Loader2 } from 'lucide-react'
import { StripePaymentForm } from './StripePaymentForm.jsx'

const OHIO_TAX_RATE = 0.0575

// Initialize Stripe
const stripePromise = loadStripe('pk_live_51SKkfCJvt1ZyezmhasffrG4ou59z3yoHLZOOv2GfZ4Jtf6YXB8XJ3niC1oKHuYsgwgcVMq5h8R0bNJ35KOkKsQ8q00oG7Q8sZp')

export function ProposalViewNew({ selectedServices = [], services = [], answers = {}, onBack, onNext }) {
  const [discount, setDiscount] = useState(0)
  const [waiveSetupFees, setWaiveSetupFees] = useState(false)
  const [showNegotiation, setShowNegotiation] = useState(false)
  const [clientSignature, setClientSignature] = useState('')
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [paymentMethodId, setPaymentMethodId] = useState(null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const signaturePadRef = useRef(null)
  const canvasRef = useRef(null)
  
  // Debug logging
  useEffect(() => {
    console.log('ProposalViewNew - selectedServices:', selectedServices)
    console.log('ProposalViewNew - services:', services)
    console.log('ProposalViewNew - answers:', answers)
  }, [selectedServices, services, answers])
  
  // Initialize signature pad
  useEffect(() => {
    if (canvasRef.current && !signaturePadRef.current) {
      import('signature_pad').then((SignaturePad) => {
        const canvas = canvasRef.current
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

  // Get selected service details
  const selectedServiceDetails = selectedServices.map(id => 
    services.find(s => s.id === id)
  ).filter(Boolean)

  console.log('selectedServiceDetails:', selectedServiceDetails)

  // Calculate totals
  const setupSubtotal = selectedServiceDetails.reduce((sum, s) => sum + (s.setupFee || 0), 0)
  const monthlySubtotal = selectedServiceDetails.reduce((sum, s) => sum + (s.monthlyFee || 0), 0)
  
  const effectiveSetupSubtotal = waiveSetupFees ? 0 : setupSubtotal
  const setupDiscount = effectiveSetupSubtotal * (discount / 100)
  const monthlyDiscount = monthlySubtotal * (discount / 100)
  
  const setupAfterDiscount = effectiveSetupSubtotal - setupDiscount
  const monthlyAfterDiscount = monthlySubtotal - monthlyDiscount
  
  const setupTax = setupAfterDiscount * OHIO_TAX_RATE
  const monthlyTax = monthlyAfterDiscount * OHIO_TAX_RATE
  
  const totalDueToday = setupAfterDiscount + setupTax
  const monthlyRecurring = monthlyAfterDiscount + monthlyTax

  // PDF Export Handler - Simplified to avoid corruption
  const handleExportPDF = async () => {
    setIsGeneratingPDF(true)
    try {
      // Dynamic import of jsPDF
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      
      let yPos = 20
      
      // Header
      doc.setFontSize(24)
      doc.setFont(undefined, 'bold')
      doc.text('Crossover AI: X', 105, yPos, { align: 'center' })
      yPos += 10
      
      doc.setFontSize(16)
      doc.text('Service Proposal', 105, yPos, { align: 'center' })
      yPos += 15
      
      // Client Information
      doc.setFontSize(12)
      doc.setFont(undefined, 'bold')
      doc.text('Client Information', 20, yPos)
      yPos += 7
      
      doc.setFont(undefined, 'normal')
      doc.setFontSize(10)
      doc.text(`Name: ${answers.name || 'N/A'}`, 20, yPos)
      yPos += 6
      doc.text(`Business: ${answers.businessName || 'N/A'}`, 20, yPos)
      yPos += 6
      doc.text(`Email: ${answers.email || 'N/A'}`, 20, yPos)
      yPos += 6
      doc.text(`Phone: ${answers.phone || 'N/A'}`, 20, yPos)
      yPos += 12
      
      // Selected Services
      doc.setFontSize(12)
      doc.setFont(undefined, 'bold')
      doc.text('Selected Services', 20, yPos)
      yPos += 8
      
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      
      selectedServiceDetails.forEach((service, index) => {
        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }
        
        doc.setFont(undefined, 'bold')
        doc.text(`${index + 1}. ${service.name}`, 20, yPos)
        yPos += 5
        
        doc.setFont(undefined, 'normal')
        doc.text(`   Setup: $${service.setupFee.toFixed(2)} | Monthly: $${service.monthlyFee.toFixed(2)}`, 20, yPos)
        yPos += 8
      })
      
      // Pricing Summary
      yPos += 5
      doc.setFontSize(12)
      doc.setFont(undefined, 'bold')
      doc.text('Pricing Summary', 20, yPos)
      yPos += 8
      
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      
      doc.text(`Setup Subtotal:`, 20, yPos)
      doc.text(`$${setupSubtotal.toFixed(2)}`, 170, yPos, { align: 'right' })
      yPos += 6
      
      doc.text(`Monthly Subtotal:`, 20, yPos)
      doc.text(`$${monthlySubtotal.toFixed(2)}`, 170, yPos, { align: 'right' })
      yPos += 6
      
      if (waiveSetupFees) {
        doc.text(`Setup Fees Waived:`, 20, yPos)
        doc.text(`-$${setupSubtotal.toFixed(2)}`, 170, yPos, { align: 'right' })
        yPos += 6
      }
      
      if (discount > 0) {
        doc.text(`Discount (${discount}%):`, 20, yPos)
        doc.text(`-$${(setupDiscount + monthlyDiscount).toFixed(2)}`, 170, yPos, { align: 'right' })
        yPos += 6
      }
      
      doc.text(`Setup Tax (5.75%):`, 20, yPos)
      doc.text(`$${setupTax.toFixed(2)}`, 170, yPos, { align: 'right' })
      yPos += 6
      
      doc.text(`Monthly Tax (5.75%):`, 20, yPos)
      doc.text(`$${monthlyTax.toFixed(2)}`, 170, yPos, { align: 'right' })
      yPos += 10
      
      // Totals
      doc.setFontSize(14)
      doc.setFont(undefined, 'bold')
      doc.text(`TOTAL DUE TODAY:`, 20, yPos)
      doc.text(`$${totalDueToday.toFixed(2)}`, 170, yPos, { align: 'right' })
      yPos += 8
      
      doc.text(`MONTHLY RECURRING:`, 20, yPos)
      doc.text(`$${monthlyRecurring.toFixed(2)}`, 170, yPos, { align: 'right' })
      yPos += 15
      
      // Signature
      if (clientSignature) {
        if (yPos > 220) {
          doc.addPage()
          yPos = 20
        }
        
        doc.setFontSize(12)
        doc.text('Client Signature', 20, yPos)
        yPos += 5
        
        try {
          doc.addImage(clientSignature, 'PNG', 20, yPos, 80, 30)
          yPos += 35
        } catch (e) {
          console.error('Error adding signature to PDF:', e)
        }
        
        doc.setFontSize(10)
        doc.setFont(undefined, 'normal')
        const signDate = new Date().toLocaleDateString()
        doc.text(`Signed on ${signDate}`, 20, yPos)
      }
      
      // Save the PDF
      const filename = `Proposal-${(answers.businessName || 'Client').replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.pdf`
      doc.save(filename)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert(`Failed to generate PDF: ${error.message}`)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Show warning if no services
  if (!selectedServiceDetails || selectedServiceDetails.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-5xl mx-auto py-8">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-red-600">No Services Selected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">No services were found. This might be a data loading issue.</p>
              <p className="text-sm text-gray-600 mb-4">Debug info:</p>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                {JSON.stringify({ 
                  selectedServices, 
                  servicesCount: services?.length,
                  hasAnswers: !!answers 
                }, null, 2)}
              </pre>
              <Button onClick={onBack} className="mt-4">← Go Back</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-5xl mx-auto py-8">
        <div className="text-center mb-8">
          <FileText className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Proposal</h1>
          <p className="text-gray-600">Review and finalize your custom package</p>
        </div>

        {/* Selected Services */}
        <Card className="shadow-xl mb-6">
          <CardHeader>
            <CardTitle>Selected Services</CardTitle>
            <CardDescription>{selectedServiceDetails.length} services included</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedServiceDetails.map(service => (
              <div key={service.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                    <p className="text-sm text-gray-600">{service.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">${service.setupFee.toFixed(2)} setup</p>
                  <p className="text-sm text-gray-600">${service.monthlyFee.toFixed(2)}/mo</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pricing Breakdown */}
        <Card className="shadow-xl mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Setup Fees */}
            <div className="space-y-2">
              <div className="flex justify-between text-lg">
                <span className="font-semibold text-gray-700">Setup Fees Subtotal:</span>
                <span className="font-semibold">${setupSubtotal.toFixed(2)}</span>
              </div>
              
              {/* Negotiation Tools */}
              {showNegotiation && (
                <>
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <Checkbox 
                      id="waive-setup"
                      checked={waiveSetupFees}
                      onCheckedChange={setWaiveSetupFees}
                    />
                    <label htmlFor="waive-setup" className="text-sm font-medium text-gray-900 cursor-pointer">
                      Waive Setup Fees (for negotiation)
                    </label>
                  </div>
                  
                  {waiveSetupFees && (
                    <div className="flex justify-between text-lg text-green-600">
                      <span>Setup Fees Waived:</span>
                      <span className="font-semibold">-${setupSubtotal.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between text-lg">
                <span className="font-semibold text-gray-700">Monthly Fees Subtotal:</span>
                <span className="font-semibold">${monthlySubtotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Negotiation Toggle Button */}
            <div className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setShowNegotiation(!showNegotiation)}
                className="w-full font-semibold"
                size="sm"
              >
                {showNegotiation ? 'Hide Negotiation Tools' : 'N'}
              </Button>
              
              {/* Discount Slider - shown when negotiation is enabled */}
              {showNegotiation && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount: {discount}%
                  </label>
                  <Slider
                    value={[discount]}
                    onValueChange={(value) => setDiscount(value[0])}
                    max={30}
                    step={5}
                    className="mb-2"
                  />
                  <p className="text-xs text-gray-600">Slide to adjust discount (0-30%)</p>
                </div>
              )}
            </div>

            {/* After Discount */}
            {discount > 0 && (
              <>
                <div className="flex justify-between text-lg text-red-600">
                  <span>Setup Discount ({discount}%):</span>
                  <span className="font-semibold">-${setupDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg text-red-600">
                  <span>Monthly Discount ({discount}%):</span>
                  <span className="font-semibold">-${monthlyDiscount.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg">
                    <span className="text-gray-700">Setup After Discount:</span>
                    <span className="font-semibold">${setupAfterDiscount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-gray-700">Monthly After Discount:</span>
                    <span className="font-semibold">${monthlyAfterDiscount.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}

            {/* Tax */}
            <div className="border-t pt-4">
              <div className="flex justify-between text-lg">
                <span className="text-gray-700">Ohio Sales Tax (5.75%) on Setup:</span>
                <span className="font-semibold">${setupTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-gray-700">Ohio Sales Tax (5.75%) on Monthly:</span>
                <span className="font-semibold">${monthlyTax.toFixed(2)}</span>
              </div>
            </div>

            {/* Totals */}
            <div className="border-t-2 border-gray-300 pt-4 space-y-3">
              <div className="flex justify-between text-2xl">
                <span className="font-bold text-gray-900">TOTAL DUE TODAY:</span>
                <span className="font-bold text-blue-600">${totalDueToday.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-2xl">
                <span className="font-bold text-gray-900">MONTHLY RECURRING:</span>
                <span className="font-bold text-green-600">${monthlyRecurring.toFixed(2)}</span>
              </div>
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
              <p className="text-sm text-green-600 mt-2">✓ Signature captured</p>
            )}
          </CardContent>
        </Card>

        {/* Payment Form */}
        {clientSignature && (
          <Elements stripe={stripePromise}>
            <StripePaymentForm
              amount={totalDueToday}
              clientInfo={{
                name: answers.name,
                email: answers.email,
                phone: answers.phone,
                businessName: answers.businessName
              }}
              selectedServices={selectedServiceDetails}
              onPaymentSuccess={(paymentData) => {
                setPaymentMethodId(paymentData.paymentMethodId)
                setShowPaymentForm(true)
              }}
              onPaymentError={(error) => {
                console.error('Payment error:', error)
              }}
            />
          </Elements>
        )}

        {/* MCP Payment Processing Button */}
        {paymentMethodId && (
          <Card className="shadow-xl border-2 border-green-500">
            <CardContent className="p-6">
              <Button
                onClick={async () => {
                  try {
                    const payload = {
                      clientInfo: {
                        name: answers.name,
                        email: answers.email,
                        phone: answers.phone,
                        businessName: answers.businessName,
                        industry: answers.industry,
                        role: answers.role
                      },
                      packageDetails: {
                        services: selectedServiceDetails.map(s => ({
                          id: s.id,
                          name: s.name,
                          setupFee: s.setupFee,
                          monthlyFee: s.monthlyFee,
                          description: s.description
                        })),
                        pricing: {
                          setupSubtotal,
                          monthlySubtotal,
                          setupDiscount,
                          monthlyDiscount,
                          setupAfterDiscount,
                          monthlyAfterDiscount,
                          setupTax,
                          monthlyTax,
                          totalDueToday,
                          monthlyRecurring
                        }
                      },
                      paymentAuthorization: {
                        paymentMethodId,
                        stripeAccountId: 'acct_1S7oa8Dl8F90GU3t'
                      },
                      interviewResponses: answers,
                      ghlSubAccount: selectedServiceDetails.find(s => s.isTestPackage)?.ghlSubAccount || 'crossoveraix',
                      billingSchedule: selectedServiceDetails.find(s => s.isTestPackage)?.billingSchedule || {
                        setupImmediate: true,
                        recurringDelay: '30d',
                        recurringAmount: monthlyRecurring
                      },
                      testMode: selectedServiceDetails.some(s => s.isTestPackage)
                    }
                    
                    console.log('MCP Payload:', payload)
                    
                    // Send to payment API endpoint
                    // On Render, both servers run on the same machine, so localhost:3003 works
                    // For local dev, use the exposed URL
                    const apiUrl = import.meta.env.VITE_PAYMENT_API_URL || '/api/mcp/process-payment'
                    const response = await fetch(apiUrl, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                    })
                    
                    setIsProcessingPayment(true)
                    
                    if (response.ok) {
                      setPaymentSuccess(true)
                      alert('Payment processed and account created successfully!')
                      setTimeout(() => onNext(), 2000)
                    } else {
                      throw new Error('Payment processing failed')
                    }
                  } catch (error) {
                    console.error('MCP Error:', error)
                    alert('Error processing payment: ' + error.message)
                  } finally {
                    setIsProcessingPayment(false)
                  }
                }}
                disabled={isProcessingPayment || paymentSuccess}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-8 text-xl font-bold shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Processing Payment...
                  </>
                ) : paymentSuccess ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 mr-3" />
                    Payment Successful!
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-6 h-6 mr-3" />
                    Process Payment & Create Account
                  </>
                )}
              </Button>
              <p className="text-center text-sm text-gray-600 mt-4">
                This will charge ${totalDueToday.toFixed(2)} today and set up recurring billing of ${monthlyRecurring.toFixed(2)}/month
              </p>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1"
          >
            ← Back to Package
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            disabled={!clientSignature || isGeneratingPDF}
            className="flex-1"
          >
            {isGeneratingPDF ? (
              <>Generating PDF...</>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </>
            )}
          </Button>
          <Button
            onClick={onNext}
            disabled={!clientSignature}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Continue to Asset Gathering →
          </Button>
        </div>
      </div>
    </div>
  )
}

