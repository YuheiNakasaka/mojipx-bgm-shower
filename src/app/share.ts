// Handing a link to the listener's friends: the share sheet on phones and tablets, the clipboard elsewhere.

export type Shared = 'shared' | 'copied' | 'dismissed';

export type ShareData = { readonly title: string; readonly text: string; readonly url: string };

// Desktop share sheets exist too, but there a copied link is what people expect.
const prefersSheet = (): boolean => typeof navigator.share === 'function' && window.matchMedia?.('(pointer: coarse)').matches;

const isAbort = (e: unknown): boolean => e instanceof DOMException && e.name === 'AbortError';

/** Shares or copies the link; where neither is allowed, shows it so it can be copied by hand. Call it inside a tap or key press. */
export const shareLink = async (data: ShareData): Promise<Shared> => {
  if (prefersSheet()) {
    try {
      await navigator.share(data);
      return 'shared';
    } catch (e) {
      if (isAbort(e)) return 'dismissed';
    }
  }
  try {
    await navigator.clipboard.writeText(data.url);
    return 'copied';
  } catch {
    window.prompt('Copy this link', data.url);
    return 'dismissed';
  }
};
