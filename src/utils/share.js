import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

// Production web domain used when running from localhost or a non-web origin
export const WEB_BASE_URL = 'https://quiet-heliotrope-f4ea50.netlify.app';

export const getShareBaseUrl = () =>
    (window.location.origin && !window.location.origin.includes('localhost'))
        ? window.location.origin
        : WEB_BASE_URL;

/**
 * Share a link via the native share sheet (Capacitor), the Web Share API, or
 * clipboard/alert fallbacks — in that order.
 *
 * @param {object} opts
 * @param {string} opts.title      Share sheet title
 * @param {string} opts.text       Message text (link is appended)
 * @param {string} opts.link       https URL to share
 * @param {string} [opts.nativeUrl] Optional app-scheme URL used on native platforms
 * @param {string} [opts.dialogTitle] Native share dialog title
 * @param {string} [opts.copiedMessage] Alert text after clipboard fallback
 */
export async function shareLink({ title, text, link, nativeUrl, dialogTitle = 'Share', copiedMessage = 'Link copied to clipboard! 🍻' }) {
    try {
        if (Capacitor.isNativePlatform()) {
            await Share.share({
                title,
                text: `${text} ${link}`,
                url: nativeUrl || link,
                dialogTitle,
            });
        } else if (navigator.share) {
            await navigator.share({
                title,
                text: `${text} ${link}`,
                url: link,
            });
        } else {
            throw new Error('Web Share not supported');
        }
    } catch {
        try {
            await navigator.clipboard.writeText(`${text} ${link}`);
            alert(copiedMessage);
        } catch (err) {
            console.error('Clipboard failed', err);
            alert(`Link: ${link}`);
        }
    }
}
