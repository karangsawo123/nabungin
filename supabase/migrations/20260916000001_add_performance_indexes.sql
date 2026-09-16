-- ============================================================================
-- NABUNGIN PERFORMANCE & INDEXES OPTIMIZATION (Supabase Best Practices)
-- ============================================================================

-- 1. Index pada Foreign Keys untuk mempercepat JOIN, CASCADE, dan RLS queries
CREATE INDEX IF NOT EXISTS idx_group_members_user_id 
    ON public.group_members(user_id);

CREATE INDEX IF NOT EXISTS idx_group_invites_group_id 
    ON public.group_invites(group_id);

CREATE INDEX IF NOT EXISTS idx_goals_group_id 
    ON public.goals(group_id);

CREATE INDEX IF NOT EXISTS idx_transactions_goal_id 
    ON public.transactions(goal_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id 
    ON public.transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_category_id 
    ON public.transactions(category_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_group_id 
    ON public.activity_logs(group_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
    ON public.notifications(user_id);

-- 2. Partial Index untuk Notifikasi yang belum dibaca (Unread Bell Counter)
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
    ON public.notifications(user_id) 
    WHERE is_read = FALSE;
