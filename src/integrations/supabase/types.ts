export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      browserstack_configs: {
        Row: {
          browser: string | null
          browser_version: string | null
          created_at: string | null
          device: string | null
          device_type: Database["public"]["Enums"]["device_type"]
          id: string
          is_active: boolean | null
          is_predefined: boolean | null
          mac_res: string | null
          name: string
          orientation: string | null
          os: string
          os_version: string
          updated_at: string | null
          user_id: string
          win_res: string | null
        }
        Insert: {
          browser?: string | null
          browser_version?: string | null
          created_at?: string | null
          device?: string | null
          device_type: Database["public"]["Enums"]["device_type"]
          id?: string
          is_active?: boolean | null
          is_predefined?: boolean | null
          mac_res?: string | null
          name: string
          orientation?: string | null
          os: string
          os_version: string
          updated_at?: string | null
          user_id: string
          win_res?: string | null
        }
        Update: {
          browser?: string | null
          browser_version?: string | null
          created_at?: string | null
          device?: string | null
          device_type?: Database["public"]["Enums"]["device_type"]
          id?: string
          is_active?: boolean | null
          is_predefined?: boolean | null
          mac_res?: string | null
          name?: string
          orientation?: string | null
          os?: string
          os_version?: string
          updated_at?: string | null
          user_id?: string
          win_res?: string | null
        }
        Relationships: []
      }
      comparison_tests: {
        Row: {
          baseline_url: string
          created_at: string | null
          id: string
          new_url: string
          status: Database["public"]["Enums"]["test_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          baseline_url: string
          created_at?: string | null
          id?: string
          new_url: string
          status?: Database["public"]["Enums"]["test_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          baseline_url?: string
          created_at?: string | null
          id?: string
          new_url?: string
          status?: Database["public"]["Enums"]["test_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      test_screenshots: {
        Row: {
          ai_analysis_results: Json | null
          ai_analysis_status: string | null
          analysis_completed_at: string | null
          baseline_screenshot_url: string | null
          color_diff_score: number | null
          created_at: string | null
          device_name: string
          diff_percentage: number | null
          id: string
          layout_diff_score: number | null
          new_screenshot_url: string | null
          os_version: string
          test_id: string | null
          text_diff_score: number | null
        }
        Insert: {
          ai_analysis_results?: Json | null
          ai_analysis_status?: string | null
          analysis_completed_at?: string | null
          baseline_screenshot_url?: string | null
          color_diff_score?: number | null
          created_at?: string | null
          device_name: string
          diff_percentage?: number | null
          id?: string
          layout_diff_score?: number | null
          new_screenshot_url?: string | null
          os_version: string
          test_id?: string | null
          text_diff_score?: number | null
        }
        Update: {
          ai_analysis_results?: Json | null
          ai_analysis_status?: string | null
          analysis_completed_at?: string | null
          baseline_screenshot_url?: string | null
          color_diff_score?: number | null
          created_at?: string | null
          device_name?: string
          diff_percentage?: number | null
          id?: string
          layout_diff_score?: number | null
          new_screenshot_url?: string | null
          os_version?: string
          test_id?: string | null
          text_diff_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_screenshots_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "comparison_tests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      device_type: "desktop" | "mobile"
      test_status: "pending" | "in_progress" | "completed" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
