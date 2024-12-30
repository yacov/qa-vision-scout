import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to fetch available browsers from BrowserStack
const BROWSERSTACK_USERNAME = Deno.env.get('BROWSERSTACK_USERNAME')
const BROWSERSTACK_ACCESS_KEY = Deno.env.get('BROWSERSTACK_ACCESS_KEY')
const BROWSERSTACK_API_BASE = 'https://api.browserstack.com/automate'

const getAvailableBrowsers = async (): Promise<any[]> => {
  const response = await fetch(`${BROWSERSTACK_API_BASE}/browsers.json`, {
    headers: {
      'Authorization': `Basic ${btoa(`${BROWSERSTACK_USERNAME}:${BROWSERSTACK_ACCESS_KEY}`)}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch browsers: ${response.statusText}`);
  }
  
  return response.json();
}

// Function to validate and format browser version
const validateBrowserVersion = (version: string | null | undefined): string | null => {
  if (!version || version === 'null' || version.trim() === '') {
    return null
  }
  
  const trimmedVersion = version.trim()
  if (trimmedVersion.toLowerCase() === 'latest') {
    return 'latest'
  }

  // Check if version is in valid format (e.g., "121.0" or "11")
  const versionRegex = /^\d+(\.\d+)?$/
  if (!versionRegex.test(trimmedVersion)) {
    console.error('Invalid browser version format:', trimmedVersion)
    throw new Error(`Invalid browser version format: ${trimmedVersion}`)
  }

  return trimmedVersion
}

// Function to validate browser configuration
const validateBrowserConfig = (config: any, availableBrowsers: any[]): boolean => {
  if (config.device) {
    // For mobile devices
    return availableBrowsers.some(b => 
      b.os === config.os &&
      b.os_version === config.os_version &&
      b.device === config.device
    )
  } else {
    // For desktop browsers
    const matchingBrowser = availableBrowsers.find(b => 
      b.os === config.os &&
      b.os_version === config.os_version &&
      b.browser === config.browser
    )

    if (!matchingBrowser) return false

    // If browser_version is specified and not 'latest', validate it
    if (config.browser_version && config.browser_version !== 'latest') {
      return matchingBrowser.browser_version === config.browser_version
    }

    return true
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { testId, baselineUrl, newUrl, configIds } = await req.json()

    console.log('Creating screenshots for test:', testId)
    console.log('Baseline URL:', baselineUrl)
    console.log('New URL:', newUrl)
    console.log('Config IDs:', configIds)

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch selected configurations
    const { data: selectedConfigs, error: configError } = await supabaseClient
      .from('browserstack_configs')
      .select('*')
      .in('id', configIds)

    if (configError) {
      console.error('Error fetching configurations:', configError)
      throw new Error('Failed to fetch configurations')
    }

    if (!selectedConfigs || selectedConfigs.length === 0) {
      throw new Error('No configurations selected')
    }

    console.log('Selected configurations:', selectedConfigs)

    // Fetch available browsers from BrowserStack
    const availableBrowsers = await getAvailableBrowsers()
    console.log('Available BrowserStack configurations:', availableBrowsers)

    // Map configurations to BrowserStack format
    const browsers = []
    for (const config of selectedConfigs) {
      // Validate and format os_version
      if (!config.os_version || config.os_version.trim() === '' || config.os_version === 'null') {
        console.error('Invalid os_version for config:', config)
        throw new Error(`Invalid os_version for configuration: ${config.name}`)
      }

      let browserConfig: any = {
        os: config.os,
        os_version: config.os_version.trim()
      }

      if (config.device_type === 'mobile') {
        // For mobile devices
        browserConfig.device = config.device
      } else {
        // For desktop browsers
        browserConfig.browser = config.browser
        
        // Validate and format browser_version
        const validatedVersion = validateBrowserVersion(config.browser_version)
        if (validatedVersion) {
          browserConfig.browser_version = validatedVersion
        }
      }

      // Validate the configuration against available browsers
      if (!validateBrowserConfig(browserConfig, availableBrowsers)) {
        console.error('Invalid browser configuration:', browserConfig)
        throw new Error(`Invalid browser configuration for: ${config.name}. Please check available browsers and versions.`)
      }

      console.log(`Valid ${config.device_type} configuration:`, browserConfig)
      browsers.push(browserConfig)
    }

    console.log('Mapped browser configurations:', browsers)

    // Configure screenshot settings
    const commonSettings = {
      quality: 'compressed',
      wait_time: 5,
      local: false,
      mac_res: '1024x768',
      win_res: '1024x768',
      browsers: browsers,
    }

    // Generate screenshots for baseline URL
    const baselineJob = await new Promise((resolve, reject) => {
      fetch(`${BROWSERSTACK_API_BASE}/screenshots`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${BROWSERSTACK_USERNAME}:${BROWSERSTACK_ACCESS_KEY}`)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...commonSettings,
          url: baselineUrl,
        })
      })
      .then(response => {
        if (!response.ok) {
          reject(new Error(`Failed to generate baseline screenshots: ${response.statusText}`))
        } else {
          resolve(response.json())
        }
      })
      .catch(error => {
        reject(error)
      })
    })

    // Generate screenshots for new URL
    const newJob = await new Promise((resolve, reject) => {
      fetch(`${BROWSERSTACK_API_BASE}/screenshots`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${BROWSERSTACK_USERNAME}:${BROWSERSTACK_ACCESS_KEY}`)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...commonSettings,
          url: newUrl,
        })
      })
      .then(response => {
        if (!response.ok) {
          reject(new Error(`Failed to generate new screenshots: ${response.statusText}`))
        } else {
          resolve(response.json())
        }
      })
      .catch(error => {
        reject(error)
      })
    })

    // Update test status
    await supabaseClient
      .from('comparison_tests')
      .update({ status: 'in_progress' })
      .eq('id', testId)

    // Create screenshot records
    const screenshots = browsers.map(browser => ({
      test_id: testId,
      device_name: browser.device || `${browser.browser} on ${browser.os}`,
      os_version: browser.os_version,
      baseline_screenshot_url: null,
      new_screenshot_url: null,
      diff_percentage: null,
    }))

    await supabaseClient
      .from('test_screenshots')
      .insert(screenshots)

    return new Response(
      JSON.stringify({
        baselineJob,
        newJob,
        message: 'Screenshot generation initiated',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error in browserstack-screenshots function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})