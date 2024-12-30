// @ts-ignore: Deno imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore: Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore: Deno imports
import browserstack from 'npm:browserstack'

// Declare Deno types
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

interface BrowserStackConfig {
  id: string
  device_type: 'desktop' | 'mobile'
  os: string
  os_version: string
  browser?: string
  browser_version?: string
  device?: string
}

serve(async (req) => {
  try {
    const { configId } = await req.json()
    
    // Create BrowserStack client
    const client = browserstack.createClient({
      username: Deno.env.get('BROWSERSTACK_USERNAME') || '',
      password: Deno.env.get('BROWSERSTACK_ACCESS_KEY') || ''
    })

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get config from database
    const { data: config, error: configError } = await supabaseClient
      .from('browserstack_configs')
      .select('*')
      .eq('id', configId)
      .single()

    if (configError || !config) {
      throw new Error('Configuration not found')
    }

    // Get available browsers from BrowserStack
    const browsers = await new Promise((resolve, reject) => {
      client.getBrowsers((error: any, browsers: any) => {
        if (error) reject(error)
        else resolve(browsers)
      })
    })

    // Validate configuration
    const validationResult = validateConfig(config, browsers as any[])

    return new Response(
      JSON.stringify(validationResult),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

function validateConfig(config: BrowserStackConfig, availableBrowsers: any[]) {
  if (config.device_type === 'mobile') {
    const matchingDevice = availableBrowsers.find(b => 
      b.os?.toLowerCase() === config.os?.toLowerCase() &&
      b.os_version === config.os_version &&
      b.device === config.device
    )

    if (matchingDevice) {
      return {
        valid: true,
        message: 'Configuration is valid',
        config: matchingDevice
      }
    }

    // Find closest match
    const closestMatch = availableBrowsers.find(b => 
      b.os?.toLowerCase() === config.os?.toLowerCase() &&
      b.device === config.device
    )

    if (closestMatch) {
      return {
        valid: false,
        message: `Configuration not found. Closest match found with OS version ${closestMatch.os_version}`,
        suggestion: closestMatch
      }
    }
  } else {
    const matchingBrowser = availableBrowsers.find(b => 
      b.os?.toLowerCase() === config.os?.toLowerCase() &&
      b.os_version === config.os_version &&
      b.browser?.toLowerCase() === config.browser?.toLowerCase() &&
      (config.browser_version === 'latest' || b.browser_version === config.browser_version)
    )

    if (matchingBrowser) {
      return {
        valid: true,
        message: 'Configuration is valid',
        config: matchingBrowser
      }
    }

    // Find closest match
    const closestMatch = availableBrowsers.find(b => 
      b.os?.toLowerCase() === config.os?.toLowerCase() &&
      b.browser?.toLowerCase() === config.browser?.toLowerCase()
    )

    if (closestMatch) {
      return {
        valid: false,
        message: `Configuration not found. Closest match found with OS version ${closestMatch.os_version} and browser version ${closestMatch.browser_version}`,
        suggestion: closestMatch
      }
    }
  }

  return {
    valid: false,
    message: 'No matching or similar configuration found',
    suggestion: null
  }
}