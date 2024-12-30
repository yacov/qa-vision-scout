interface Config {
  os: string;
  os_version: string;
  device_type: string;
}

interface NormalizedConfig {
  os: string;
  os_version: string;
}

const OS_MAP: Record<string, string> = {
  'windows': 'Windows',
  'macos': 'OS X',
  'ios': 'ios',
  'android': 'android'
};

const VERSION_MAP: Record<string, Record<string, string>> = {
  'Windows': {
    '11': '11',
    '10': '10',
    'windows 11': '11',
    'windows 10': '10'
  },
  'OS X': {
    'sonoma': 'Sonoma',
    'ventura': 'Ventura',
    'monterey': 'Monterey',
    'big sur': 'Big Sur',
    'catalina': 'Catalina'
  },
  'ios': {
    '17': '17',
    '16': '16',
    '15': '15'
  },
  'android': {
    '14.0': '14.0',
    '14': '14.0',
    '13.0': '13.0',
    '13': '13.0',
    '12.0': '12.0',
    '12': '12.0'
  }
};

export function normalizeOsConfig(config: Config): NormalizedConfig {
  const normalizedOs = OS_MAP[config.os.toLowerCase()] || config.os;
  const osVersions = VERSION_MAP[normalizedOs] || {};
  const normalizedVersion = osVersions[config.os_version.toLowerCase()] || config.os_version;

  console.log('Normalizing OS config:', {
    input: config,
    normalizedOs,
    normalizedVersion
  });

  return {
    os: normalizedOs,
    os_version: normalizedVersion
  };
}