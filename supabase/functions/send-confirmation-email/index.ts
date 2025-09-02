import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Edge function called for sending confirmation email')
    
    const requestData = await req.json()
    console.log('Request data received:', JSON.stringify(requestData, null, 2))

    // Extract data from the request
    const {
      employeeName,
      employeeEmail,
      employeeId,
      enrollmentDate,
      totalPremium,
      familyMembersCount,
      parentalCoverageSelected,
      parentalCoverageType,
      employee,
      familyMembers,
      parents,
      premiums
    } = requestData

    console.log('Extracted employee email:', employeeEmail)
    console.log('Total premium:', totalPremium)

    // Get SendGrid configuration from environment
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')
    const sendgridTemplateId = Deno.env.get('SENDGRID_TEMPLATE_ID')
    const fromEmail = 'info@loophealth.com'
    const toEmail = employeeEmail

    if (!sendgridApiKey || !sendgridTemplateId) {
      console.error('Missing SendGrid configuration')
      throw new Error('Email service not configured')
    }

    console.log('Using SendGrid template ID:', sendgridTemplateId)

    // Prepare template data for SendGrid
    const templateData = {
      // Basic employee info
      employee_name: employeeName,
      employee_id: employeeId,
      enrollment_date: enrollmentDate,
      sum_insured_lakhs: '10',
      joining_date: employee?.date_of_birth_formatted || employee?.joining_date || '',
      employee_share: totalPremium > 0 ? `₹${Math.round(totalPremium).toLocaleString()}` : '₹0',
      
      // Employee details for template
      employee: {
        name: employee?.name || employeeName,
        emp_id: employee?.emp_id || employeeId,
        date_of_birth_formatted: employee?.date_of_birth_formatted || '',
        gender: employee?.gender || '',
        age: employee?.age || 0
      },
      
      // Family members array
      family_members: familyMembers || [],
      
      // Parents array
      parents: parents || [],
      
      // Parental coverage flags
      has_parental_coverage: parentalCoverageSelected && parents && parents.length > 0,
      
      // Premium details
      parental_premium: premiums?.parentalPolicy ? Math.round(premiums.parentalPolicy).toLocaleString() : '0',
      gst_amount: premiums?.gst ? Math.round(premiums.gst).toLocaleString() : '0',
      total_premium: totalPremium > 0 ? Math.round(totalPremium).toLocaleString() : '0',
      monthly_deduction: totalPremium > 0 ? Math.round(totalPremium / 12).toLocaleString() : '0',
      
      // Company details
      client_name: 'Innovaccer Inc.',
      hr_email: 'hr@innovaccer.com',
      year: new Date().getFullYear().toString(),
      
      // Logo URLs
      innovaccer_logo_url: 'https://cdn.brandfetch.io/idMbRL3_se/w/800/h/135/theme/dark/logo.png?c=1bxid64Mup7aczewSAYMX&t=1668070663872',
      loop_logo_url: 'https://cdn.prod.website-files.com/619b33946e0527b5a12bec15/61f8edaecca71a1ae15ec68b_loop-logo-moss.svg'
    }

    console.log('Template data prepared:', JSON.stringify(templateData, null, 2))

    // Prepare SendGrid email payload
    const emailPayload = {
      personalizations: [
        {
          to: [{ email: toEmail, name: employeeName }],
          dynamic_template_data: templateData
        }
      ],
      from: { email: fromEmail, name: 'Loop Health' },
      template_id: sendgridTemplateId
    }

    console.log('Sending email via SendGrid...')

    // Send email via SendGrid
    const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    })

    console.log('SendGrid response status:', sendgridResponse.status)

    if (!sendgridResponse.ok) {
      const errorText = await sendgridResponse.text()
      console.error('SendGrid error response:', errorText)
      throw new Error(`SendGrid API error: ${sendgridResponse.status} - ${errorText}`)
    }

    console.log('Email sent successfully via SendGrid')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Confirmation email sent successfully',
        recipient: toEmail
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in send-confirmation-email function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to send confirmation email',
        details: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})