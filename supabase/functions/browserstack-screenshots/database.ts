import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export const createSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

export const updateTestStatus = async (supabaseClient: any, testId: string, status: string) => {
  await supabaseClient
    .from('comparison_tests')
    .update({ status })
    .eq('id', testId);
};

export const createScreenshotRecords = async (supabaseClient: any, testId: string, browsers: any[]) => {
  const screenshots = browsers.map(browser => ({
    test_id: testId,
    device_name: browser.device || `${browser.browser} on ${browser.os}`,
    os_version: browser.os_version,
    baseline_screenshot_url: null,
    new_screenshot_url: null,
    diff_percentage: null,
  }));

  await supabaseClient
    .from('test_screenshots')
    .insert(screenshots);
};