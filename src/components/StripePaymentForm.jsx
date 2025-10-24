import { useState } from 'react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx'
import { CreditCard, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: false,
}

export function StripePaymentForm({ 
  amount, 
  clientInfo, 
  selectedServices,
  onPaymentSuccess,
  onPaymentError 
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setPaymentError(null)

    const cardElement = elements.getElement(CardElement)

    try {
      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: clientInfo.name,
          email: clientInfo.email,
          phone: clientInfo.phone,
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      // Payment method created successfully
      setPaymentSuccess(true)
      
      // Call parent callback with payment method
      if (onPaymentSuccess) {
        onPaymentSuccess({
          paymentMethodId: paymentMethod.id,
          amount: amount,
          clientInfo: clientInfo,
          selectedServices: selectedServices
        })
      }

    } catch (err) {
      setPaymentError(err.message)
      if (onPaymentError) {
        onPaymentError(err)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Information
        </CardTitle>
        <CardDescription>
          Secure credit card collection powered by Stripe
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Total Due Today:</span>
              <span className="text-2xl font-bold text-blue-600">
                ${amount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Card Element */}
          <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>

          {/* Error Message */}
          {paymentError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Payment Error</p>
                <p className="text-sm text-red-700">{paymentError}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {paymentSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Payment Method Saved</p>
                <p className="text-sm text-green-700">Ready to process payment</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!stripe || isProcessing || paymentSuccess}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : paymentSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Payment Method Saved
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Save Payment Method
              </>
            )}
          </Button>

          {/* Security Notice */}
          <p className="text-xs text-gray-500 text-center">
            🔒 Your payment information is encrypted and secure. We never store your card details.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

