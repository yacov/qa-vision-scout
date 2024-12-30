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
    const { testId, baselineUrl, newUrl } = await req.json()

    console.log('Creating screenshots for test:', testId)
    console.log('Baseline URL:', baselineUrl)
    console.log('New URL:', newUrl)

    // Create BrowserStack Screenshots client
    const client = BrowserStack.createScreenshotClient({
      username: Deno.env.get('BROWSERSTACK_USERNAME'),
      password: Deno.env.get('BROWSERSTACK_ACCESS_KEY'),
    })

    // Configure screenshot settings with proper browser objects
    const commonSettings = {
      quality: 'compressed',
      wait_time: 5,
      local: false,
      mac_res: '1024x768',
      win_res: '1024x768',
      browsers: [
        // Desktop browsers
        {
          os: 'Windows',
          os_version: '11',
          browser: 'chrome',
          browser_version: '121.0',
          device: null
        },
        {
          os: 'OS X',
          os_version: 'Sonoma',
          browser: 'safari',
          browser_version: '17.0',
          device: null
        },
        // Mobile device
        {
          os: 'ios',
          os_version: '15',
          device: 'iPhone 13',
          browser: null,
          browser_version: null
        }
      ],
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

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Update test status to in_progress
    await supabaseClient
      .from('comparison_tests')
      .update({ status: 'in_progress' })
      .eq('id', testId)

    // Create screenshot records
    const screenshots = commonSettings.browsers.map(browser => ({
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