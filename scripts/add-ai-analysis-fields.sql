-- Add AI analysis fields to screenshots table

-- Add processing status enum type
DO $$ BEGIN
  CREATE TYPE processing_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns for AI processing
ALTER TABLE screenshots
ADD COLUMN IF NOT EXISTS processing_status processing_status_enum DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS processing_error TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_screenshots_processing_status ON screenshots(processing_status);
CREATE INDEX IF NOT EXISTS idx_screenshots_processed_at ON screenshots(processed_at);
CREATE INDEX IF NOT EXISTS idx_screenshots_user_processing_status ON screenshots(user_id, processing_status);

-- Add comment to document the ai_analysis structure
COMMENT ON COLUMN screenshots.ai_analysis IS 'Structured AI analysis from Groq Vision API: {
  "app_name": "Application name detected",
  "window_title": "Window title/content",
  "activity_category": "productive|neutral|distracting",
  "detected_text": "Extracted text content",
  "activity_type": "coding|browsing|video|gaming|document|social|other",
  "focus_score": 0-100,
  "content_summary": "Brief description",
  "detected_objects": ["list", "of", "objects"],
  "confidence": 0-1
}';

COMMENT ON COLUMN screenshots.processing_status IS 'AI processing status: pending, processing, completed, or failed';
COMMENT ON COLUMN screenshots.processed_at IS 'Timestamp when AI processing completed';
COMMENT ON COLUMN screenshots.processing_error IS 'Error message if processing failed';
