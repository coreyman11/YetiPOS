-- Check RLS policies for store_pages and store_navigation tables
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('store_pages', 'store_navigation')
ORDER BY tablename, cmd;