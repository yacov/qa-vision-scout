import { corsHeaders } from '../_shared/cors.ts'
import { generateScreenshots } from './browserstack-api.ts'
import { logger } from './utils/logger.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const username = Deno.env.get('BROWSERSTACK_USERNAME')
    const accessKey = Deno.env.get('BROWSERSTACK_ACCESS_KEY')

    if (!username || !accessKey) {
      logger.error({
        message: 'Missing BrowserStack credentials',
        username: !!username,
        accessKey: !!accessKey
      })
      throw new Error('BrowserStack credentials not configured')
    }

    const { url, selected_configs } = await req.json()

    if (!url || !selected_configs) {
      logger.error({
        message: 'Invalid request payload',
        url: !!url,
        configsPresent: !!selected_configs
      })
      throw new Error('Missing required parameters: url and selected_configs')
    }

    logger.info({
      message: 'Generating screenshots',
      url,
      configCount: selected_configs.length
    })

    const result = await generateScreenshots(url, selected_configs)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    logger.error({
      message: 'Error in browserstack-screenshots function',
      error: error.message,
      stack: error.stack
    })

    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: error.name || 'UnknownError'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})