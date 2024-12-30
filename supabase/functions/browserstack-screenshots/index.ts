// Main edge function handler
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAvailableBrowsers, generateScreenshots } from "./browserstack-api.ts";
import { validateBrowserConfig } from "./browser-validation.ts";
import { createSupabaseClient, updateTestStatus, createScreenshotRecords } from "./database.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BROWSERSTACK_USERNAME = Deno.env.get('BROWSERSTACK_USERNAME');
const BROWSERSTACK_ACCESS_KEY = Deno.env.get('BROWSERSTACK_ACCESS_KEY');

if (!BROWSERSTACK_USERNAME || !BROWSERSTACK_ACCESS_KEY) {
  throw new Error('Browserstack credentials not configured');
}

const authHeader = {
  'Authorization': `Basic ${btoa(`${BROWSERSTACK_USERNAME}:${BROWSERSTACK_ACCESS_KEY}`)}`,
  'Content-Type': 'application/json'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { testId, baselineUrl, newUrl, configIds } = await req.json();
    console.log('Creating screenshots for test:', testId);
    console.log('Baseline URL:', baselineUrl);
    console.log('New URL:', newUrl);
    console.log('Config IDs:', configIds);

    const supabaseClient = createSupabaseClient();

    const { data: selectedConfigs, error: configError } = await supabaseClient
      .from('browserstack_configs')
      .select('*')
      .in('id', configIds);

    if (configError) {
      console.error('Error fetching configurations:', configError);
      throw new Error('Failed to fetch configurations');
    }

    if (!selectedConfigs || selectedConfigs.length === 0) {
      throw new Error('No configurations selected');
    }

    console.log('Selected configurations:', selectedConfigs);

    const availableBrowsers = await getAvailableBrowsers(authHeader);
    console.log('Available BrowserStack configurations:', availableBrowsers);

    const browsers = selectedConfigs.map(config => {
      console.log('Processing config:', JSON.stringify(config, null, 2));

      // Normalize Windows version names
      const normalizeWindowsVersion = (version: string) => {
        const versionMap: { [key: string]: string } = {
          '11': '11',
          '10': '10',
          'windows 11': '11',
          'windows 10': '10'
        };
        return versionMap[version.toLowerCase()] || version;
      };

      const browserConfig = {
        os: config.os === 'Windows' ? 'Windows' : config.os, // Preserve Windows casing
        os_version: normalizeWindowsVersion(config.os_version.trim())
      };

      if (config.device_type === 'mobile') {
        browserConfig.device = config.device;
      } else {
        browserConfig.browser = config.browser;
        // Handle browser version with proper casing
        browserConfig.browser_version = config.browser_version?.toLowerCase() === 'latest' ? 'Latest' : config.browser_version;
      }

      console.log('Created browser config:', JSON.stringify(browserConfig, null, 2));

      return browserConfig;
    });

    const commonSettings = {
      quality: 'compressed' as const,
      wait_time: 5,
      local: false,
      mac_res: '1024x768',
      win_res: '1024x768',
      browsers
    };

    console.log('Generating baseline screenshots...');
    const baselineJob = await generateScreenshots({
      ...commonSettings,
      url: baselineUrl
    }, authHeader);

    console.log('Generating new version screenshots...');
    const newJob = await generateScreenshots({
      ...commonSettings,
      url: newUrl
    }, authHeader);

    await updateTestStatus(supabaseClient, testId, 'in_progress');
    await createScreenshotRecords(supabaseClient, testId, browsers);

    console.log('Screenshot generation completed successfully');
    return new Response(
      JSON.stringify({
        baselineJob,
        newJob,
        message: 'Screenshot generation initiated',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error in browserstack-screenshots function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});

// Function to validate browser configuration
const validateBrowserConfig = (config: BrowserstackBrowser, availableBrowsers: BrowserstackBrowser[]): boolean => {
  const normalizedConfig = {
    os: config.os?.toLowerCase(),
    os_version: config.os_version,
    browser: config.browser?.toLowerCase(),
    browser_version: config.browser_version?.toLowerCase(),
    device: config.device
  };

  console.log('Validating config:', JSON.stringify(normalizedConfig, null, 2));
  console.log('Available browsers:', JSON.stringify(availableBrowsers.slice(0, 5), null, 2)); // Show first 5 for brevity

  // Find matching OS configurations
  const osMatches = availableBrowsers.filter(b => {
    const osMatch = b.os?.toLowerCase() === normalizedConfig.os;
    console.log(`Checking OS match for ${b.os?.toLowerCase()} === ${normalizedConfig.os}: ${osMatch}`);
    return osMatch;
  });

  console.log(`Found ${osMatches.length} OS matches`);

  // Find matching OS version
  const osVersionMatches = osMatches.filter(b => {
    const versionMatch = b.os_version === normalizedConfig.os_version;
    console.log(`Checking OS version match for ${b.os_version} === ${normalizedConfig.os_version}: ${versionMatch}`);
    return versionMatch;
  });

  if (osVersionMatches.length === 0) {
    console.log('Available OS versions:', osMatches.map(b => b.os_version));
    console.log(`No matching OS version found for ${normalizedConfig.os} ${normalizedConfig.os_version}`);
    return false;
  }

  if (config.device) {
    // For mobile devices
    const isValid = osVersionMatches.some(b => b.device === normalizedConfig.device);
    console.log(`Mobile device validation result for ${normalizedConfig.device}:`, isValid);
    return isValid;
  } else {
    // For desktop browsers
    if (!normalizedConfig.browser) {
      console.log('Missing browser information for desktop configuration');
      return false;
    }

    const browserMatches = osVersionMatches.filter(b => {
      const browserMatch = b.browser?.toLowerCase() === normalizedConfig.browser;
      console.log(`Checking browser match for ${b.browser?.toLowerCase()} === ${normalizedConfig.browser}: ${browserMatch}`);
      return browserMatch;
    });

    if (browserMatches.length === 0) {
      console.log('Available browsers for this OS version:', 
        osVersionMatches.map(b => ({ browser: b.browser, version: b.browser_version }))
      );
      console.log(`No matching browser found for ${normalizedConfig.browser}`);
      return false;
    }

    // Special handling for 'latest' version
    if (!normalizedConfig.browser_version || 
        normalizedConfig.browser_version === 'latest' || 
        normalizedConfig.browser_version === 'Latest') {
      // Get the highest version number for this browser
      const versions = browserMatches
        .map(b => b.browser_version)
        .filter(v => v) // Remove null/undefined
        .sort((a, b) => {
          const [aMajor = 0] = a!.split('.').map(Number);
          const [bMajor = 0] = b!.split('.').map(Number);
          return bMajor - aMajor;
        });
      
      console.log(`Using latest version (${versions[0]}) for ${normalizedConfig.browser}`);
      return true;
    }

    // For specific versions, check if the version exists
    const hasVersion = browserMatches.some(b => {
      const availableVersion = b.browser_version?.toLowerCase();
      console.log(`Comparing requested version ${normalizedConfig.browser_version} with available version ${availableVersion}`);
      return availableVersion === normalizedConfig.browser_version ||
             availableVersion?.startsWith(normalizedConfig.browser_version!);
    });
    
    if (!hasVersion) {
      console.log('Available versions for this browser:', browserMatches.map(b => b.browser_version));
    }
    
    console.log(`Version validation result for ${normalizedConfig.browser_version}:`, hasVersion);
    return hasVersion;
  }
}