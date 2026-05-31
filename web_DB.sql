-- ==========================================
-- 1. SEED USERS & HARDWARE
-- ==========================================
INSERT INTO users (id, full_name, username, email, phone, password_hash, secret_code, role) VALUES
('b0e8b822-0000-4000-a000-000000000001', 'Nimna', 'Nima', 'operator@nima.dev', '+94 77 XXX XXXX', 'hashed_pass_123', 'AEX4921B7C', 'admin'),
('b0e8b822-0000-4000-a000-000000000002', 'Matrix Core', 'SysAdmin', 'core@csx.dev', NULL, 'hashed_pass_456', 'SYS9999XYZ', 'admin');

INSERT INTO hardware_nodes (user_id, device_name, device_type, sync_status) VALUES
('b0e8b822-0000-4000-a000-000000000001', 'Lenovo LOQ ARP15', 'desktop', 'active_sync'),
('b0e8b822-0000-4000-a000-000000000001', 'Samsung Mobile Device', 'mobile', 'offline');

-- ==========================================
-- 2. SEED RESEARCH VAULT
-- ==========================================
INSERT INTO research_papers (id, doi_slug, title, field_category, status, published_date, abstract, methodology, conclusion) VALUES
('c0e8b822-0000-4000-a000-000000000001', 'v2.4.0', 'Spatial DOM Recycling Models', 'Frontend Physics Research', 'peer_reviewed', '2026-05-02', 'An academic exploration into high-performance, physics-driven user interface architecture.', 'A highly controlled empirical setup was established using Next.js 14 to render 10,000 spatial nodes simultaneously.', 'The findings conclusively demonstrate that decoupling spatial animations from the React render cycle eliminates layout thrashing.'),
('c0e8b822-0000-4000-a000-000000000002', 'v2.3.5', 'AI Neural Node Mapping', 'Machine Learning / Systems', 'published', '2026-05-15', 'Research detailing the structural inheritance and latency optimization within a 30-class Object-Oriented AI model.', 'Data was streamed through a multi-layered neural network utilizing cross-entropy loss functions.', 'Synchronizing localized desktop inference with cloud-based storage reduces overall processing latency by 40%.');

INSERT INTO research_metrics (research_id, label, metric_value, trend_indicator) VALUES
('c0e8b822-0000-4000-a000-000000000001', 'Confidence Interval', '99.8%', 'High'),
('c0e8b822-0000-4000-a000-000000000001', 'Sample Size', '1.2M', 'Valid'),
('c0e8b822-0000-4000-a000-000000000002', 'Data Accuracy', '94.2%', '+2.1%');

INSERT INTO research_figures (research_id, title, hue_gradient) VALUES
('c0e8b822-0000-4000-a000-000000000001', 'DOM Node Render Graph', 'from-emerald-500 to-teal-900'),
('c0e8b822-0000-4000-a000-000000000001', 'Garbage Collection Spikes', 'from-green-500 to-emerald-900');

-- ==========================================
-- 3. SEED RELEASES VAULT
-- ==========================================
INSERT INTO releases (id, version_tag, title, tag_label, published_date, summary, impact, commits_count) VALUES
('d0e8b822-0000-4000-a000-000000000001', '2.4.0', 'Spatial API & Generative Models', 'Major Core Update', '2026-05-27', 'This release fundamentally rewrites the core generative pipeline.', 'Users querying the AI models will experience an 84% reduction in inference latency.', 42),
('d0e8b822-0000-4000-a000-000000000002', '2.3.5', 'Lanka Washing System Sync', 'Fullstack Patch', '2026-05-15', 'Stabilization patch for the Lanka Washing System architecture.', 'Administrative users will notice instantaneous status updates across the web dashboard.', 18);

INSERT INTO changelogs (release_id, log_type, description) VALUES
('d0e8b822-0000-4000-a000-000000000001', 'added', 'Gemini API generative endpoints'),
('d0e8b822-0000-4000-a000-000000000001', 'added', 'Framer Motion physics engine integration'),
('d0e8b822-0000-4000-a000-000000000001', 'changed', 'Node.js server routing protocols via FNM'),
('d0e8b822-0000-4000-a000-000000000001', 'breaking', '> Legacy DOM nodes strictly recycled.'),
('d0e8b822-0000-4000-a000-000000000002', 'fixed', 'Resolved cross-origin resource sharing (CORS)');

-- ==========================================
-- 4. SEED METADATA (Topics & Contributors)
-- ==========================================
INSERT INTO contributors (id, name) VALUES
('e0e8b822-0000-4000-a000-000000000001', 'Nima'),
('e0e8b822-0000-4000-a000-000000000002', 'CSx Matrix Systems');

INSERT INTO topics (id, name) VALUES
('f0e8b822-0000-4000-a000-000000000001', 'Physics Animation'),
('f0e8b822-0000-4000-a000-000000000002', 'Neural Networks');

-- ==========================================
-- 5. SEED DIGITAL ASSETS
-- ==========================================
INSERT INTO digital_assets (research_id, release_id, file_name, file_type, file_size, icon_enum) VALUES
('c0e8b822-0000-4000-a000-000000000001', NULL, 'DOM Render Telemetry', 'JSON', '2.4 GB', 'FileJson'),
(NULL, 'd0e8b822-0000-4000-a000-000000000001', 'Source Code (zip)', 'Archive', '14.2 MB', 'FileArchive'),
(NULL, 'd0e8b822-0000-4000-a000-000000000001', 'Windows Installer (exe)', 'Executable', '89.5 MB', 'Monitor');

-- ==========================================
-- 6. SEED JUNCTION TABLES (Linking)
-- ==========================================
INSERT INTO research_contributors (research_id, contributor_id) VALUES
('c0e8b822-0000-4000-a000-000000000001', 'e0e8b822-0000-4000-a000-000000000001'),
('c0e8b822-0000-4000-a000-000000000002', 'e0e8b822-0000-4000-a000-000000000002');

INSERT INTO release_contributors (release_id, contributor_id) VALUES
('d0e8b822-0000-4000-a000-000000000001', 'e0e8b822-0000-4000-a000-000000000001');

INSERT INTO research_topics (research_id, topic_id) VALUES
('c0e8b822-0000-4000-a000-000000000001', 'f0e8b822-0000-4000-a000-000000000001');

-- ==========================================
-- 7. SEED SAVED VAULT (Bookmarks)
-- ==========================================
INSERT INTO saved_vault (user_id, research_id, release_id) VALUES
('b0e8b822-0000-4000-a000-000000000001', 'c0e8b822-0000-4000-a000-000000000001', NULL),
('b0e8b822-0000-4000-a000-000000000001', NULL, 'd0e8b822-0000-4000-a000-000000000001');