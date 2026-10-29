-- Adds the join table behind User.savedReleases <-> Release.savedBy (Prisma implicit m-n).
-- Purely additive: creates one new table, touches no existing data.
--
-- Apply ONE of:
--   a) npx prisma db push                       (from /backend, preferred - it is how this DB was built)
--   b) run this file in the Supabase SQL editor (use if db push wants to change anything else)
--
-- Column A = Release.id, column B = User.id (Prisma orders them alphabetically by model name).

CREATE TABLE IF NOT EXISTS "_SavedReleases" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "_SavedReleases_AB_unique" ON "_SavedReleases"("A", "B");
CREATE INDEX IF NOT EXISTS "_SavedReleases_B_index" ON "_SavedReleases"("B");

ALTER TABLE "_SavedReleases"
    ADD CONSTRAINT "_SavedReleases_A_fkey" FOREIGN KEY ("A") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_SavedReleases"
    ADD CONSTRAINT "_SavedReleases_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
