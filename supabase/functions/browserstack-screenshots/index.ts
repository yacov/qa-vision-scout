import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import BrowserStack from 'npm:browserstack'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to fetch available browsers from BrowserStack
const getAvailableBrowsers = async (client: any): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    client.getBrowsers((error: any, browsers: any[]) => {
      if (error) {
        console.error('Error fetching available browsers:', error)
        reject(error)
      } else {
        resolve(browsers)
      }
    })
  })
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

    // If browser_version is specified, validate it
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

    // Create Supabase client to fetch configurations
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

    // Create BrowserStack Screenshots client
    const client = BrowserStack.createScreenshotClient({
      username: Deno.env.get('BROWSERSTACK_USERNAME'),
      password: Deno.env.get('BROWSERSTACK_ACCESS_KEY'),
    })

    // Fetch available browsers from BrowserStack
    const availableBrowsers = await getAvailableBrowsers(client)
    console.log('Available BrowserStack configurations:', availableBrowsers)

    // Map configurations to BrowserStack format
    const browsers = []
    for (const config of selectedConfigs) {
      // Validate and format os_version
      if (!config.os_version || config.os_version.trim() === '' || config.os_version === 'null') {
        console.error('Invalid os_version for config:', config)
        throw new Error(`Invalid os_version for configuration: ${config.name}`)
      }

      let browserConfig
      if (config.device_type === 'mobile') {
        // For mobile devices
        browserConfig = {
          os: config.os,
          os_version: config.os_version.trim(),
          device: config.device
        }
      } else {
        // For desktop browsers
        browserConfig = {
          os: config.os,
          os_version: config.os_version.trim(),
          browser: config.browser
        }

        // Only add browser_version if it exists and is valid
        if (config.browser_version && 
            config.browser_version !== 'null' && 
            config.browser_version.trim() !== '') {
          
          const version = config.browser_version.trim()
          browserConfig.browser_version = version.toLowerCase() === 'latest' ? 'latest' : version
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
      client.generateScreenshots({
        ...commonSettings,
        url: baselineUrl,
      }, (error, job) => {
        if (error) {
          console.error('Error generating baseline screenshots:', error)
          reject(error)
        } else {
          console.log('Baseline screenshots job created:', job)
          resolve(job)
        }
      })
    })

    // Generate screenshots for new URL
    const newJob = await new Promise((resolve, reject) => {
      client.generateScreenshots({
        ...commonSettings,
        url: newUrl,
      }, (error, job) => {
        if (error) {
          console.error('Error generating new screenshots:', error)
          reject(error)
        } else {
          console.log('New screenshots job created:', job)
          resolve(job)
        }
      })
    })

    // Update test status to in_progress
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