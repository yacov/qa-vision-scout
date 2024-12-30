import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'
import { validateBrowserConfig } from '../browserstack-screenshots/browser-validation.ts'
import { getAvailableBrowsers } from '../browserstack-screenshots/browserstack-api.ts'

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { config } = await req.json()

    // Get BrowserStack credentials from environment
    const username = Deno.env.get('BROWSERSTACK_USERNAME')
    const accessKey = Deno.env.get('BROWSERSTACK_ACCESS_KEY')

    if (!username || !accessKey) {
      throw new Error('BrowserStack credentials not configured')
    }

    const authHeader = {
      'Authorization': `Basic ${btoa(`${username}:${accessKey}`)}`
    }

    // Get available browsers from BrowserStack
    const browsers = await getAvailableBrowsers(authHeader)

    // Validate the configuration
    const isValid = validateBrowserConfig(config, browsers)

    return new Response(
      JSON.stringify({ 
        valid: isValid,
        message: isValid ? 'Configuration is valid' : 'Configuration is not supported by BrowserStack'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})