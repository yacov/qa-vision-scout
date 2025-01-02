import { corsHeaders } from '../_shared/cors.ts'
import { generateScreenshots } from './browserstack-api.ts'
import { logger } from './utils/logger.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { testId, url, selected_configs } = await req.json()

    if (!testId || !url || !selected_configs) {
      throw new Error('Missing required parameters')
    }

    logger.info({
      message: 'Generating screenshots',
      testId,
      url,
      configCount: selected_configs.length
    })

    const result = await generateScreenshots(testId, url, selected_configs)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    logger.error({
      message: 'Error in browserstack-screenshots function',
      error: error.message
    })

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})