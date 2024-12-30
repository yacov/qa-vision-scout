import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import BrowserStack from 'npm:browserstack'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Map configurations to BrowserStack format
    const browsers = selectedConfigs.map(config => {
      if (config.device_type === 'mobile') {
        // For mobile devices
        return {
          os: config.os,
          os_version: config.os_version,
          device: config.device
        }
      } else {
        // For desktop browsers
        const desktopConfig: any = {
          os: config.os,
          os_version: config.os_version,
          browser: config.browser
        }

        // Only add browser_version if it exists and is not null/empty
        if (config.browser_version && 
            config.browser_version !== 'null' && 
            config.browser_version.trim() !== '') {
          desktopConfig.browser_version = config.browser_version === 'latest' 
            ? 'latest' 
            : config.browser_version
        }

        console.log('Desktop browser configuration:', desktopConfig)
        return desktopConfig
      }
    })

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