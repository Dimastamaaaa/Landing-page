/**
 * mock-data.js — DELLATEPE Mock Data
 * 
 * Static data exports used across the landing page when no backend is connected.
 * Mirrors the Prisma schema shapes (Artist, Track) so the UI code doesn't need
 * to change when real API data replaces these constants.
 */

// ─── Artist Profile ─────────────────────────────────────────────────────────
export const ARTIST = {
  name: 'DELLATEPE',
  tagline: 'Lo-fi soul. Garage punk. All yours.',
  bio: 'Born from the static of late-night radio and the warmth of analog tape, DELLATEPE crafts sonic landscapes that blur the line between noise and melody. Based in Jakarta, drawing from the raw energy of garage punk and the intimacy of lo-fi soul, every track is a piece of autobiography encoded in frequency and rhythm. No labels. No compromise. Just sound, stripped to its marrow.',
  photo: null,
  city: 'Jakarta, Indonesia',
  genres: ['AMBIENT', 'GARAGE', 'SOUL', 'LO-FI'],
  socials: {
    instagram: '#',
    spotify: '#',
    youtube: '#',
    tiktok: '#'
  },
  quote: '"Ada sesuatu yang perlu dikatakan lewat bunyi."'
};

// ─── Track Catalogue ─────────────────────────────────────────────────────────
export const TRACKS = [
  {
    id: '1',
    title: 'HOLLOW SIGNAL',
    duration: 213,
    bpm: 92,
    key: 'C Minor',
    mood: ['melancholic', 'ambient'],
    album: 'Static Dreams',
    sortOrder: 1,
    lyrics: 'Through the hollow signal I hear your voice calling from the static, a frequency only hearts can decode...'
  },
  {
    id: '2',
    title: 'STATIC DREAMS',
    duration: 252,
    bpm: 108,
    key: 'A Minor',
    mood: ['cinematic', 'dark'],
    album: 'Static Dreams',
    sortOrder: 2,
    lyrics: 'In static dreams we dance, silhouettes against the noise floor, finding rhythm in the chaos...'
  },
  {
    id: '3',
    title: 'RADIO GHOST',
    duration: 178,
    bpm: 120,
    key: 'E Minor',
    mood: ['energetic', 'raw'],
    album: 'Static Dreams',
    sortOrder: 3,
    lyrics: 'Radio ghost transmitting on dead frequencies, the signal never dies it just changes shape...'
  },
  {
    id: '4',
    title: 'ANALOG HEART',
    duration: 294,
    bpm: 76,
    key: 'G Minor',
    mood: ['melancholic', 'warm'],
    album: 'Tape Letters',
    sortOrder: 4,
    lyrics: 'This analog heart beats in warm distortion, every crack in the vinyl is a wrinkle in time...'
  },
  {
    id: '5',
    title: 'TAPE LETTERS',
    duration: 231,
    bpm: 98,
    key: 'D Minor',
    mood: ['nostalgic', 'intimate'],
    album: 'Tape Letters',
    sortOrder: 5,
    lyrics: 'Rewinding tape letters from a future that never came, magnetic memories dissolving into hiss...'
  }
];

// ─── Featured Lyric (used in the large pull-quote section) ───────────────────
export const FEATURED_LYRIC =
  'Through the hollow signal I hear your voice calling from the static';

// ─── Contact Form Subject Options ────────────────────────────────────────────
export const CONTACT_SUBJECTS = [
  'Kolaborasi',
  'Booking',
  'Media',
  'Lainnya'
];
