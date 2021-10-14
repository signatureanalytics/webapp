import memoize from 'nano-memoize';

/**
 * slug - returns a url friendly human readable version of an input string
 *
 * steps:
 *   1. convert input string to lowercase
 *   2. normalize string using unicode canonical decomposition (normal form d) into constituent parts
 *   3. remove all diacritic characters from decomposed string
 *   4. encode into uri component safe string
 *   5. replace each run of hyphens and uri escape sequences into a single hyphen
 *   6. trim leading and trailing hyphens
 */
export const slug = (input = '') => {
    const lowered = input.toLowerCase();
    const decomposed = lowered.normalize('NFD');
    const stripped = decomposed.replace(/\p{Diacritic}/gu, '');
    const encoded = encodeURIComponent(stripped);
    const hyphenated = encoded.replace(/(-|%[0-9A-Z]{2})+/g, '-');
    const slug = hyphenated.replace(/^-|-$/g, '');
    return slug;
};

export default memoize(slug);
