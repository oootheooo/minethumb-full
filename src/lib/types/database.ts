export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          first_name: string | null;
          last_name: string | null;
          username: string | null;
          avatar_url: string | null;
          stripe_customer_id: string | null;
          plan_id: string;
          credits_remaining: number;
          monthly_generation_limit: number;
          generations_this_period: number;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      generations: {
        Row: {
          id: string;
          user_id: string;
          status: string;
          video_description: string;
          hook: string | null;
          prompt: string | null;
          output_image_path: string | null;
          model: string | null;
          image_size: string | null;
          error_message: string | null;
          openai_response_id: string | null;
          credit_cost: number;
          created_at: string;
          completed_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['generations']['Row']> & {
          user_id: string;
          video_description: string;
        };
        Update: Partial<Database['public']['Tables']['generations']['Row']>;
      };
      generation_assets: {
        Row: {
          id: string;
          generation_id: string;
          user_id: string;
          asset_type: string;
          storage_bucket: string;
          storage_path: string;
          content_type: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['generation_assets']['Row']> & {
          user_id: string;
          asset_type: string;
          storage_bucket: string;
          storage_path: string;
        };
        Update: Partial<Database['public']['Tables']['generation_assets']['Row']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
