export const DEPTS = [
  { id: 'content', name: 'Content', short: 'CT', blurb: 'Blogs, web copy, service & city pages',
    cats: ['Grammar / typos', 'Target keyword missing', 'Brief not followed', 'Reads AI-written', 'Plagiarism / duplicate', 'Formatting & headings', 'Wrong facts / NAP', 'Weak CTA'] },
  { id: 'graphics', name: 'Graphics', short: 'GR', blurb: 'Social creatives, GBP images, banners',
    cats: ['Off-brand colors / fonts', 'Typo in design', 'Wrong size / dimensions', 'Low resolution', 'Logo misuse', 'Missing CTA / contact', 'Wrong client details'] },
  { id: 'gmb', name: 'GMB', short: 'GB', blurb: 'Google Business Profile posts & listings',
    cats: ['NAP mismatch', 'Wrong primary category', 'Post not published', 'Missing / poor photos', 'Review reply missing', 'Keyword-stuffed post', 'Wrong service area', 'Suspension risk'] },
  { id: 'onpage', name: 'SEO On-page', short: 'ON', blurb: 'Titles, metas, headings, schema, links',
    cats: ['Meta title / description', 'H1 / heading structure', 'Keyword stuffing', 'Broken internal link', 'Missing alt text', 'Schema missing / invalid', 'Thin / duplicate page', 'Not indexed'] },
  { id: 'offpage', name: 'SEO Off-page', short: 'OF', blurb: 'Backlinks, citations, directories',
    cats: ['Citation NAP mismatch', 'Toxic / spammy backlink', 'Wrong anchor text', 'Low-quality placement', 'Link not indexed', 'Duplicate listing', 'Report not updated'] },
  { id: 'webdev', name: 'Web Dev', short: 'WD', blurb: 'Builds, fixes, speed and forms',
    cats: ['Mobile layout broken', '404 / broken link', 'Form not working', 'Slow page speed', 'SSL / mixed content', 'Wrong content pushed', 'Tracking / GA missing', 'Design mismatch'] },
];
export const DMAP = Object.fromEntries(DEPTS.map((d) => [d.id, d]));

export const SEV = [
  { id: 'critical', name: 'Critical', v: '--crit' },
  { id: 'high', name: 'High', v: '--high' },
  { id: 'medium', name: 'Medium', v: '--med' },
  { id: 'low', name: 'Low', v: '--low' },
];
export const SMAP = Object.fromEntries(SEV.map((s) => [s.id, s]));

export const STATUS = { open: 'Open', progress: 'In progress', resolved: 'Resolved' };
export const DAY = 864e5;
