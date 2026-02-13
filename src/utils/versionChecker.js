/**
 * Version Update Checker
 * Checks GitHub Releases for new versions and notifies users
 */

const GITHUB_OWNER = 'Areakend';
const GITHUB_REPO = 'VMJ';
const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Compare two semantic version strings
 * @param {string} version1 - e.g., "v0.3.1" or "0.3.1"
 * @param {string} version2 - e.g., "v0.3.2" or "0.3.2"
 * @returns {number} - 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(version1, version2) {
    // Remove 'v' prefix if present
    const v1 = version1.replace(/^v/, '').split('.').map(Number);
    const v2 = version2.replace(/^v/, '').split('.').map(Number);

    for (let i = 0; i < 3; i++) {
        if (v1[i] > v2[i]) return 1;
        if (v1[i] < v2[i]) return -1;
    }
    return 0;
}

/**
 * Check if there's a newer version available on GitHub
 * @param {string} currentVersion - Current app version from package.json
 * @returns {Promise<object|null>} - Release object if update available, null otherwise
 */
export async function checkForUpdate(currentVersion) {
    try {
        // Check localStorage to avoid spamming API
        const lastCheck = localStorage.getItem('lastVersionCheck');
        const skippedVersion = localStorage.getItem('skippedVersion');

        if (lastCheck) {
            const timeSinceLastCheck = Date.now() - parseInt(lastCheck);
            if (timeSinceLastCheck < CHECK_INTERVAL) {
                return null; // Already checked recently
            }
        }

        // Fetch latest release from GitHub
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
            { headers: { 'Accept': 'application/vnd.github.v3+json' } }
        );

        if (!response.ok) {
            console.warn('[VersionChecker] Failed to fetch latest release:', response.status);
            return null;
        }

        const release = await response.json();

        // Update last check timestamp
        localStorage.setItem('lastVersionCheck', Date.now().toString());

        // Check if user skipped this version
        if (skippedVersion === release.tag_name) {
            return null;
        }

        // Compare versions
        if (compareVersions(release.tag_name, currentVersion) > 0) {
            return {
                version: release.tag_name,
                name: release.name,
                body: release.body,
                url: release.html_url,
                publishedAt: release.published_at,
                assets: release.assets
            };
        }

        return null;
    } catch (error) {
        console.error('[VersionChecker] Error checking for updates:', error);
        return null;
    }
}

/**
 * Mark a version as skipped (don't show again for this version)
 * @param {string} version - Version to skip
 */
export function skipVersion(version) {
    localStorage.setItem('skippedVersion', version);
}

/**
 * Clear the last check timestamp to force a new check
 */
export function forceCheck() {
    localStorage.removeItem('lastVersionCheck');
}
