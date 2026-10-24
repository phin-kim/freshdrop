BEGIN;

ALTER TABLE public.riders
ADD COLUMN IF NOT EXISTS "profilePic" TEXT
DEFAULT 'https://api.dicebear.com/10.x/adventurer/svg?backgroundColor=e7d7bd&skinColor=c9a883,b08e66,967458&hairColor=5a3d28,6b4f35,7d6047&inkColor=3a2a1c&eyesColor=3a2a1c&scleraColor=f7ecd8&lipsColor=8a5a44&tongueColor=a87a5e&throatColor=6b4230&uvulaColor=6b4230&teethColor=f7ecd8&detailsVariant=birthmark,freckles,mustache';

ALTER TABLE public.riders
ALTER COLUMN "profilePic" SET NOT NULL;

COMMIT;