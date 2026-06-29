// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Default Admin
  const defaultEmail = 'admin@soundform.local';
  const existingAdmin = await prisma.admin.findUnique({
    where: { email: defaultEmail }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await prisma.admin.create({
      data: {
        email: defaultEmail,
        password: hashedPassword
      }
    });
    console.log('✓ Default admin account created: admin@soundform.local / admin123');
  } else {
    console.log('✓ Admin account already exists.');
  }

  // 2. Create Artist Bio
  const existingArtist = await prisma.artist.findFirst();
  if (!existingArtist) {
    await prisma.artist.create({
      data: {
        name: 'DELLATEPE',
        tagline: 'Lo-fi soul. Garage punk. All yours.',
        bio: 'Born from the static of late-night radio and the warmth of analog tape, Dellatepe crafts sonic landscapes that blur the line between noise and melody. Based in Jakarta, drawing from the raw energy of garage punk and the intimacy of lo-fi soul, every track is a piece of autobiography encoded in frequency and rhythm. No labels. No compromise. Just sound, stripped to its marrow.',
        photoUrl: '/public/artist_portrait.png',
        genre: JSON.stringify(['AMBIENT', 'GARAGE', 'SOUL', 'LO-FI']),
        socialLinks: JSON.stringify({
          instagram: '#',
          spotify: '#',
          youtube: '#',
          tiktok: '#'
        })
      }
    });
    console.log('✓ Default artist bio seeded.');
  } else {
    console.log('✓ Artist bio already exists.');
  }

  // 3. Create Sample Album and Tracks
  const existingAlbum = await prisma.album.findFirst();
  if (!existingAlbum) {
    const album = await prisma.album.create({
      data: {
        title: 'Static Dreams',
        releaseDate: new Date('2026-06-01'),
        description: 'Debut EP by Dellatepe, featuring analog tape experiments and lo-fi soundscapes.'
      }
    });

    const tracksData = [
      {
        title: 'HOLLOW SIGNAL',
        audioUrl: '/public/audio/hollow_signal.wav',
        duration: 213,
        bpm: 92,
        key: 'C Minor',
        mood: JSON.stringify(['melancholic', 'ambient']),
        lyrics: 'Through the hollow signal I hear your voice calling from the static, a frequency only hearts can decode...',
        isPublished: true,
        sortOrder: 1,
        albumId: album.id
      },
      {
        title: 'STATIC DREAMS',
        audioUrl: '/public/audio/static_dreams.wav',
        duration: 252,
        bpm: 108,
        key: 'A Minor',
        mood: JSON.stringify(['cinematic', 'dark']),
        lyrics: 'In static dreams we dance, silhouettes against the noise floor, finding rhythm in the chaos...',
        isPublished: true,
        sortOrder: 2,
        albumId: album.id
      },
      {
        title: 'RADIO GHOST',
        audioUrl: '/public/audio/radio_ghost.wav',
        duration: 178,
        bpm: 120,
        key: 'E Minor',
        mood: JSON.stringify(['energetic', 'raw']),
        lyrics: 'Radio ghost transmitting on dead frequencies, the signal never dies it just changes shape...',
        isPublished: true,
        sortOrder: 3,
        albumId: album.id
      }
    ];

    for (const track of tracksData) {
      await prisma.track.create({ data: track });
    }

    console.log('✓ Static Dreams EP and tracks seeded.');
  } else {
    console.log('✓ Albums/tracks already seeded.');
  }

  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
