export interface Test {
  id: string;
  baseline_url: string;
  new_url: string;
  status: 'completed' | 'failed' | 'in_progress' | 'pending' | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string;
  test_screenshots: Array<{
    id: string;
    test_id: string | null;
    baseline_screenshot_url: string | null;
    new_screenshot_url: string | null;
    device_name: string;
    os_version: string;
    diff_percentage: number | null;
    created_at: string | null;
  }>;
} 