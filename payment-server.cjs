const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const Stripe = require('stripe');

const app = express();
const PORT = 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Stripe configuration
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = Stripe(STRIPE_SECRET_KEY);
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_ONBOARDING_PIPELINE_ID = 'lWqPrn6RK2eURjtOZWdN';
const GHL_PAID_INVOICE_STAGE_ID = 'ec0de481-33e5-4c67-b47c-d4d0e5a5a730';

// Helper function to run MCP CLI commands
function runMCPCommand(toolName, params) {
  return new Promise((resolve, reject) => {
    const tempFile = `/tmp/mcp-input-${Date.now()}.json`;
    fs.writeFileSync(tempFile, JSON.stringify(params));
    
    const inputJson = JSON.stringify(params).replace(/'/g, "'\\''" );
    const command = `manus-mcp-cli tool call ${toolName} --server ghl --input '${inputJson}'`;
    
    exec(command, (error, stdout, stderr) => {
      // Clean up temp file
      try { fs.unlinkSync(tempFile); } catch (e) {}
      
      if (error) {
        console.error(`MCP Error: ${error.message}`);
        return reject(error);
      }
      
      try {
        // Parse JSON from output (skip any non-JSON lines)
        const lines = stdout.split('\n');
        const jsonLine = lines.find(line => line.trim().startsWith('{'));
        if (jsonLine) {
          const result = JSON.parse(jsonLine);
          resolve(result);
        } else {
          reject(new Error('No JSON output from MCP command'));
        }
      } catch (parseError) {
        console.error('Parse error:', parseError);
        reject(parseError);
      }
    });
  });
}

// Payment processing endpoint
app.post('/api/mcp/process-payment', async (req, res) => {
  try {
    const {
      clientInfo,
      packageDetails,
      paymentAuthorization,
      interviewData,
      billingSchedule
    } = req.body;

    console.log('=== PAYMENT PROCESSING STARTED ===');
    console.log('Client:', clientInfo.name);
    console.log('Package:', packageDetails.services[0]?.name || 'Unknown');
    
    // Extract pricing and payment method from correct locations
    const setupFee = packageDetails.pricing?.totalDueToday || 0;
    const monthlyFee = packageDetails.pricing?.monthlyRecurring || 0;
    const packageName = packageDetails.services[0]?.name || 'Unknown Package';
    const paymentMethodId = paymentAuthorization?.paymentMethodId;
    
    console.log('Setup fee (total due today):', setupFee);
    console.log('Monthly recurring:', monthlyFee);
    console.log('Payment method ID:', paymentMethodId);

    // Step 1: Check if payment method is already attached to a customer
    console.log('\nStep 1: Checking payment method...');
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    let customer;
    
    if (paymentMethod.customer) {
      // Payment method is already attached to a customer - use that customer
      console.log('✓ Payment method already attached to customer:', paymentMethod.customer);
      customer = await stripe.customers.retrieve(paymentMethod.customer);
      console.log('✓ Using existing customer:', customer.id, customer.email);
      
      // Update customer details if needed
      if (customer.email !== clientInfo.email || customer.name !== clientInfo.name) {
        console.log('Updating customer details...');
        customer = await stripe.customers.update(customer.id, {
          email: clientInfo.email,
          name: clientInfo.name,
          metadata: {
            package_name: packageName
          }
        });
        console.log('✓ Customer details updated');
      }
    } else {
      // Payment method not attached yet - create new customer and attach
      console.log('Creating new Stripe customer...');
      customer = await stripe.customers.create({
        email: clientInfo.email,
        name: clientInfo.name,
        metadata: {
          package_name: packageName
        }
      });
      console.log('✓ Customer created:', customer.id);
      
      // Attach payment method to new customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id
      });
      console.log('✓ Payment method attached to customer');
    }

    // Step 3: Process Stripe payment (setup fee)
    console.log('\nStep 3: Processing Stripe payment...');
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(setupFee) * 100), // Convert to cents
      currency: 'usd',
      customer: customer.id,
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
      description: `Setup fee for ${packageName}`,
      metadata: {
        client_name: clientInfo.name,
        client_email: clientInfo.email,
        package_name: packageName
      }
    });

    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment failed: ' + paymentIntent.status);
    }

    console.log('✓ Payment succeeded:', paymentIntent.id);
    console.log('✓ Amount charged: $' + (paymentIntent.amount / 100).toFixed(2));

    // Step 4: Create subscription for recurring billing
    console.log('\nStep 4: Creating recurring subscription...');

    // Set payment method as default (it's already attached from Step 2)
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });

    console.log('✓ Payment method set as default');

    // Create price for recurring billing
    const price = await stripe.prices.create({
      unit_amount: Math.round(parseFloat(monthlyFee) * 100),
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      product_data: {
        name: packageName + ' - Monthly Service'
      }
    });

    // Create subscription starting in 24 hours
    const billingCycleAnchor = Math.floor(Date.now() / 1000) + (24 * 60 * 60);
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      billing_cycle_anchor: billingCycleAnchor,
      proration_behavior: 'none',
      metadata: {
        client_name: clientInfo.name,
        package_name: packageName
      }
    });

    const nextBillingDate = new Date(billingCycleAnchor * 1000);
    console.log('✓ Subscription created:', subscription.id);
    console.log('✓ Next billing:', nextBillingDate.toISOString());

    // Step 3: Create/upsert contact in GHL
    console.log('\nStep 3: Creating GHL contact...');
    const contactParams = {
      body_locationId: GHL_LOCATION_ID,
      body_email: clientInfo.email,
      body_name: clientInfo.name,
      body_phone: clientInfo.phone || '',
      body_customFields: {
        business_name: clientInfo.businessName || '',
        package_selected: packageName,
        setup_fee: setupFee.toString(),
        monthly_fee: monthlyFee.toString(),
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id
      }
    };

    const contactResult = await runMCPCommand('contacts_upsert-contact', contactParams);
    const contactId = contactResult?.data?.contact?.id;

    if (!contactId) {
      console.warn('⚠ GHL contact creation failed, but payment succeeded');
    } else {
      console.log('✓ GHL contact created:', contactId);
      
      // Create opportunity in Onboarding Pipeline
      console.log('\nCreating GHL opportunity...');
      try {
        const opportunityResponse = await fetch('https://services.leadconnectorhq.com/opportunities/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          },
          body: JSON.stringify({
            pipelineId: GHL_ONBOARDING_PIPELINE_ID,
            locationId: GHL_LOCATION_ID,
            name: `${packageName} - ${clientInfo.name}`,
            pipelineStageId: GHL_PAID_INVOICE_STAGE_ID,
            status: 'open',
            contactId: contactId,
            monetaryValue: parseFloat(monthlyFee),
            assignedTo: '', // Can be set to a user ID if needed
            customFields: []
          })
        });
        
        if (opportunityResponse.ok) {
          const opportunityData = await opportunityResponse.json();
          console.log('✓ GHL opportunity created:', opportunityData.opportunity?.id);
          console.log('✓ Pipeline: Onboarding Pipeline');
          console.log('✓ Stage: Paid Invoice');
        } else {
          const errorText = await opportunityResponse.text();
          console.warn('⚠ GHL opportunity creation failed:', errorText);
        }
      } catch (oppError) {
        console.warn('⚠ GHL opportunity creation error:', oppError.message);
      }
      
      // Create recurring invoice schedule in GHL
      console.log('\nCreating GHL recurring invoice schedule...');
      try {
        const invoiceScheduleResponse = await fetch('https://services.leadconnectorhq.com/invoices/schedule', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          },
          body: JSON.stringify({
            altId: GHL_LOCATION_ID,
            altType: 'location',
            name: `${packageName} - Recurring`,
            liveMode: true,
            contactDetails: {
              id: contactId,
              name: clientInfo.name,
              email: clientInfo.email,
              phoneNo: clientInfo.phone || '',
              companyName: clientInfo.businessName || ''
            },
            schedule: {
              rrule: {
                intervalType: 'monthly',
                interval: 1,
                startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Start tomorrow
                startTime: '09:00:00',
                endType: 'never'
              }
            },
            businessDetails: {
              name: 'Crossover AI',
              phoneNo: '+1-555-0100',
              address: '123 Business St',
              website: 'https://crossoveraix.com'
            },
            currency: 'USD',
            items: [{
              name: packageName,
              description: 'Monthly subscription fee',
              amount: parseFloat(monthlyFee),
              qty: 1,
              type: 'one_time',
              taxes: []
            }],
            automaticTaxesEnabled: false,
            discount: {
              value: 0,
              type: 'percentage'
            },
            title: 'INVOICE',
            termsNotes: 'Thank you for your business!',
            invoiceNumberPrefix: 'REC-'
          })
        });
        
        if (invoiceScheduleResponse.ok) {
          const invoiceScheduleData = await invoiceScheduleResponse.json();
          console.log('✓ GHL recurring invoice schedule created:', invoiceScheduleData._id);
          console.log('✓ Billing frequency: Monthly');
          console.log('✓ Amount: $' + monthlyFee.toFixed(2));
        } else {
          const errorText = await invoiceScheduleResponse.text();
          console.warn('⚠ GHL recurring invoice schedule creation failed:', errorText);
        }
      } catch (invoiceError) {
        console.warn('⚠ GHL recurring invoice schedule creation error:', invoiceError.message);
      }
    }

    // Step 4: Send confirmation email to client
    if (contactId) {
      console.log('\nStep 4: Sending confirmation email...');
      
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Payment Successful!</h2>
          <p>Thank you for your purchase, ${clientInfo.name}!</p>
          
          <h3>Package Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: #f3f4f6;">
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Package:</strong></td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${packageName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Setup Fee (Paid Today):</strong></td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">$${setupFee.toFixed(2)}</td>
            </tr>
            <tr style="background: #f3f4f6;">
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Monthly Fee:</strong></td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">$${monthlyFee.toFixed(2)}/month</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Next Billing Date:</strong></td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${nextBillingDate.toLocaleDateString()}</td>
            </tr>
          </table>
          
          <p style="margin-top: 20px;">Your recurring billing will start in 24 hours.</p>
          <p>We'll be in touch soon to begin your onboarding!</p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Payment ID: ${paymentIntent.id}<br>
            Subscription ID: ${subscription.id}
          </p>
        </div>
      `;

      const emailParams = {
        body_locationId: GHL_LOCATION_ID,
        body_contactId: contactId,
        body_type: 'Email',
        body_subject: `Payment Confirmed - ${packageName}`,
        body_body_html: emailBody
      };

      await runMCPCommand('conversations_send-a-new-message', emailParams);
      console.log('✓ Confirmation email sent to client');
    }

    // Step 5: Send notification to sales team
    console.log('\nStep 5: Notifying sales team...');
    
    const salesContactParams = {
      body_locationId: GHL_LOCATION_ID,
      body_email: 'opportunities@crossoveraix.com',
      body_name: 'Sales Team'
    };

    const salesContactResult = await runMCPCommand('contacts_upsert-contact', salesContactParams);
    const salesContactId = salesContactResult?.data?.contact?.id;

    if (salesContactId) {
      const salesEmailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">💰 New Payment Received!</h2>
          
          <h3>Client Information:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background: #f3f4f6;">
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Name:</strong></td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${clientInfo.name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Email:</strong></td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${clientInfo.email}</td>
            </tr>
            <tr style="background: #f3f4f6;">
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Phone:</strong></td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${clientInfo.phone || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Business:</strong></td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${clientInfo.businessName || 'Not provided'}</td>
            </tr>
          </table>
          
          <h3>Package Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background: #f3f4f6;">
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Package:</strong></td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${packageName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Setup Fee:</strong></td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">$${setupFee.toFixed(2)} <span style="color: #10b981; font-weight: bold;">✓ PAID</span></td>
            </tr>
            <tr style="background: #f3f4f6;">
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Monthly Fee:</strong></td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">$${monthlyFee.toFixed(2)}/month (starts ${nextBillingDate.toLocaleDateString()})</td>
            </tr>
          </table>
          
          <h3>Payment Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background: #f3f4f6;">
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Payment ID:</strong></td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${paymentIntent.id}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Subscription ID:</strong></td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${subscription.id}</td>
            </tr>
            <tr style="background: #f3f4f6;">
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Customer ID:</strong></td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${customer.id}</td>
            </tr>
          </table>
          
          <p style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b;">
            <strong>⚡ Action Required:</strong> Begin client onboarding process immediately.
          </p>
        </div>
      `;

      const salesEmailParams = {
        body_locationId: GHL_LOCATION_ID,
        body_contactId: salesContactId,
        body_type: 'Email',
        body_subject: `💰 New Payment: ${clientInfo.name} - ${packageName} ($${setupFee.toFixed(2)})`,
        body_body_html: salesEmailBody
      };

      await runMCPCommand('conversations_send-a-new-message', salesEmailParams);
      console.log('✓ Sales team notified');
    }

    console.log('\n=== PAYMENT PROCESSING COMPLETE ===\n');

    // Success response
    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        paymentIntentId: paymentIntent.id,
        subscriptionId: subscription.id,
        customerId: customer.id,
        contactId: contactId || null,
        setupFee: setupFee,
        monthlyFee: monthlyFee,
        nextBillingDate: nextBillingDate.toISOString()
      }
    });

  } catch (error) {
    console.error('\n=== PAYMENT PROCESSING ERROR ===');
    console.error(error);
    console.error('================================\n');
    
    res.status(500).json({
      success: false,
      error: error.message || 'Payment processing failed'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Payment Server Running                ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║  Port: ${PORT}                            ║`);
  console.log('║  Stripe: LIVE (Test Mode)              ║');
  console.log('║  GHL: Connected                        ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  console.log(`Endpoint: http://localhost:${PORT}/api/mcp/process-payment`);
  console.log('');
});

