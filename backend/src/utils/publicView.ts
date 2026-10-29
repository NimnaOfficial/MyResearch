/**
 * Draft sanitizers.
 *
 * Unpublished posts/releases are intentionally shown to the public as "incoming" teasers
 * (title, type, tech stack, routing flags), but their body content must never leave the server
 * unless the requester is an admin.
 */

const parseJson = (raw?: string | null): Record<string, any> => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const pick = (source: Record<string, any>, keys: string[]) => {
  const out: Record<string, any> = {};
  for (const key of keys) if (source[key] !== undefined) out[key] = source[key];
  return out;
};

export const isAdminRequester = (user?: { role?: string } | null): boolean => user?.role === 'admin';

export const sanitizePostForPublic = <T extends { published: boolean; advancedData?: string | null }>(post: T): T => {
  if (post.published) return post;

  const adv = parseJson(post.advancedData);
  const teaserAdv: Record<string, any> = pick(adv, ['routing']);
  if (adv.metadata?.topics) teaserAdv.metadata = { topics: adv.metadata.topics };

  return {
    ...post,
    content: '',
    advancedData: JSON.stringify(teaserAdv),
  };
};

export const sanitizeReleaseForPublic = <T extends { published: boolean; advancedData?: string | null }>(release: T): T => {
  if (release.published) return release;

  const adv = parseJson(release.advancedData);

  return {
    ...release,
    releaseNotes: '',
    downloadUrl: null,
    advancedData: JSON.stringify(pick(adv, ['routing', 'techStack', 'leadDev'])),
  };
};
