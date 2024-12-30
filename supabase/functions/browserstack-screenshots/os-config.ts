export interface Config {
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string;
  device?: string;
}

export function normalizeOsConfig(config: Config): Config {
  const normalizedConfig = { ...config };

  // Normalize OS name
  normalizedConfig.os = normalizeOsName(config.os);

  // Normalize OS version
  normalizedConfig.os_version = normalizeOsVersion(config.os, config.os_version);

  return normalizedConfig;
}

function normalizeOsName(os: string): string {
  const osLower = os.toLowerCase();
  if (osLower === 'ios') return 'ios';
  return os.charAt(0).toUpperCase() + os.slice(1).toLowerCase();
}

function normalizeOsVersion(os: string, version: string): string {
  const osLower = os.toLowerCase();
  if (osLower === 'ios' || osLower === 'android') {
    return version.toString();
  }
  return version;
}