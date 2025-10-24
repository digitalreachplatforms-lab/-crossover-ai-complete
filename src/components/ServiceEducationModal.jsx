import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Info, X } from 'lucide-react'

export function ServiceEducationModal({ service, education, isOpen, onClose }) {
  if (!education) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            <Info className="w-6 h-6" />
            {education.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            Understanding this service in simple terms
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* What It Does */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">💡 What It Does</h3>
            <p className="text-gray-700 leading-relaxed">{education.whatItDoes}</p>
          </div>

          {/* How It Works */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">⚙️ How It Works</h3>
            <p className="text-gray-700 leading-relaxed">{education.howItWorks}</p>
          </div>

          {/* Real Example */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">✨ Real Success Story</h3>
            <p className="text-gray-700 leading-relaxed italic">{education.scenarioExample}</p>
          </div>

          {/* Pricing */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">💰 Investment</h3>
            <div className="flex gap-4">
              <div className="bg-gray-100 px-4 py-2 rounded">
                <p className="text-sm text-gray-600">Setup Fee</p>
                <p className="text-xl font-bold text-gray-900">${service.setupFee}</p>
              </div>
              <div className="bg-gray-100 px-4 py-2 rounded">
                <p className="text-sm text-gray-600">Monthly</p>
                <p className="text-xl font-bold text-gray-900">${service.monthlyFee}/mo</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Got It!</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Info button component to trigger the modal
export function ServiceInfoButton({ onClick }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation() // Prevent card click when clicking info button
        onClick()
      }}
      className="ml-2 p-1 hover:bg-blue-100 rounded-full transition-colors"
      title="Learn more about this service"
    >
      <Info className="w-4 h-4 text-blue-600" />
    </button>
  )
}

