// PDF Generation utility for proposals
// Uses jsPDF library for client-side PDF generation

export async function generateProposalPDF(data) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  
  const { selectedServices, services, answers, pricing, signature } = data
  
  // Header
  doc.setFontSize(24)
  doc.setFont(undefined, 'bold')
  doc.text('Crossover AI: X', 105, 20, { align: 'center' })
  
  doc.setFontSize(16)
  doc.text('Service Proposal', 105, 30, { align: 'center' })
  
  // Client Information
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text('Client Information', 20, 45)
  
  doc.setFont(undefined, 'normal')
  doc.setFontSize(10)
  let yPos = 52
  doc.text(`Name: ${answers.name || 'N/A'}`, 20, yPos)
  yPos += 6
  doc.text(`Business: ${answers.businessName || 'N/A'}`, 20, yPos)
  yPos += 6
  doc.text(`Email: ${answers.email || 'N/A'}`, 20, yPos)
  yPos += 6
  doc.text(`Phone: ${answers.phone || 'N/A'}`, 20, yPos)
  yPos += 6
  doc.text(`Industry: ${answers.industry || 'N/A'}`, 20, yPos)
  
  // Selected Services
  yPos += 12
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text('Selected Services', 20, yPos)
  
  yPos += 8
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  
  const serviceDetails = selectedServices.map(id => 
    services.find(s => s.id === id)
  ).filter(Boolean)
  
  serviceDetails.forEach((service, index) => {
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFont(undefined, 'bold')
    doc.text(`${index + 1}. ${service.name}`, 20, yPos)
    yPos += 5
    
    doc.setFont(undefined, 'normal')
    doc.text(`   ${service.description}`, 20, yPos)
    yPos += 5
    
    doc.text(`   Setup Fee: $${service.setupFee.toFixed(2)}`, 20, yPos)
    yPos += 5
    doc.text(`   Monthly Fee: $${service.monthlyFee.toFixed(2)}/mo`, 20, yPos)
    yPos += 8
  })
  
  // Pricing Breakdown
  yPos += 5
  if (yPos > 230) {
    doc.addPage()
    yPos = 20
  }
  
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text('Pricing Breakdown', 20, yPos)
  
  yPos += 8
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  
  doc.text(`Setup Fees Subtotal:`, 20, yPos)
  doc.text(`$${pricing.setupSubtotal.toFixed(2)}`, 170, yPos, { align: 'right' })
  yPos += 6
  
  if (pricing.waiveSetupFees) {
    doc.setTextColor(0, 150, 0)
    doc.text(`Setup Fees Waived:`, 20, yPos)
    doc.text(`-$${pricing.setupSubtotal.toFixed(2)}`, 170, yPos, { align: 'right' })
    doc.setTextColor(0, 0, 0)
    yPos += 6
  }
  
  doc.text(`Monthly Fees Subtotal:`, 20, yPos)
  doc.text(`$${pricing.monthlySubtotal.toFixed(2)}`, 170, yPos, { align: 'right' })
  yPos += 6
  
  if (pricing.discount > 0) {
    doc.setTextColor(200, 0, 0)
    doc.text(`Setup Discount (${pricing.discount}%):`, 20, yPos)
    doc.text(`-$${pricing.setupDiscount.toFixed(2)}`, 170, yPos, { align: 'right' })
    yPos += 6
    
    doc.text(`Monthly Discount (${pricing.discount}%):`, 20, yPos)
    doc.text(`-$${pricing.monthlyDiscount.toFixed(2)}`, 170, yPos, { align: 'right' })
    doc.setTextColor(0, 0, 0)
    yPos += 6
  }
  
  yPos += 2
  doc.text(`Setup After Discount:`, 20, yPos)
  doc.text(`$${pricing.setupAfterDiscount.toFixed(2)}`, 170, yPos, { align: 'right' })
  yPos += 6
  
  doc.text(`Monthly After Discount:`, 20, yPos)
  doc.text(`$${pricing.monthlyAfterDiscount.toFixed(2)}`, 170, yPos, { align: 'right' })
  yPos += 6
  
  yPos += 2
  doc.text(`Ohio Sales Tax (5.75%) on Setup:`, 20, yPos)
  doc.text(`$${pricing.setupTax.toFixed(2)}`, 170, yPos, { align: 'right' })
  yPos += 6
  
  doc.text(`Ohio Sales Tax (5.75%) on Monthly:`, 20, yPos)
  doc.text(`$${pricing.monthlyTax.toFixed(2)}`, 170, yPos, { align: 'right' })
  yPos += 8
  
  // Totals
  doc.setDrawColor(0, 0, 0)
  doc.line(20, yPos, 190, yPos)
  yPos += 6
  
  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(0, 100, 200)
  doc.text(`TOTAL DUE TODAY:`, 20, yPos)
  doc.text(`$${pricing.totalDueToday.toFixed(2)}`, 170, yPos, { align: 'right' })
  yPos += 8
  
  doc.setTextColor(0, 150, 0)
  doc.text(`MONTHLY RECURRING:`, 20, yPos)
  doc.text(`$${pricing.monthlyRecurring.toFixed(2)}`, 170, yPos, { align: 'right' })
  doc.setTextColor(0, 0, 0)
  
  // Signature
  if (signature) {
    yPos += 15
    if (yPos > 240) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('Client Signature', 20, yPos)
    
    yPos += 5
    doc.addImage(signature, 'PNG', 20, yPos, 80, 30)
    
    yPos += 35
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    const signDate = new Date().toLocaleDateString()
    const signTime = new Date().toLocaleTimeString()
    doc.text(`Signed on ${signDate} at ${signTime}`, 20, yPos)
  }
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(128, 128, 128)
    doc.text(`Crossover AI: X - Page ${i} of ${pageCount}`, 105, 285, { align: 'center' })
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 290, { align: 'center' })
  }
  
  return doc
}

export function downloadProposalPDF(doc, businessName) {
  const filename = `Proposal-${businessName.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.pdf`
  doc.save(filename)
}

