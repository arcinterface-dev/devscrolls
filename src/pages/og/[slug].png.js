import { getCollection } from 'astro:content';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';

export async function getStaticPaths() {
  const posts = await getCollection('articles');
  return posts.map(post => ({
    params: { slug: post.id },
    props: post,
  }));
}

export async function GET({ props }) {
  const post = props;
  
  let fontData = null;
  const localFontCandidates = [
    path.resolve('src/assets/fonts/Inter-Bold.ttf'),
    path.resolve('src/assets/fonts/Inter-Bold.woff'),
    'C:/Windows/Fonts/segoeui.ttf',
    'C:/Windows/Fonts/arial.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
  ];

  for (const fPath of localFontCandidates) {
    try {
      if (fs.existsSync(fPath)) {
        fontData = fs.readFileSync(fPath);
        if (fontData && fontData.length > 0) break;
      }
    } catch (e) {
      fontData = null;
    }
  }

  // Fallback to fetch from CDN if local font is not found
  if (!fontData) {
    try {
      const res = await fetch('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff');
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        fontData = Buffer.from(arrayBuf);
      }
    } catch (err) {
      fontData = null;
    }
  }

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          height: '100%',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          padding: '64px',
          fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
        },
        children: {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              justifyContent: 'space-between',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: { color: '#f59e0b', fontSize: '32px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 },
                  children: post.data.category,
                }
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: '72px', fontWeight: 700, lineHeight: 1.1, flex: 1, display: 'flex', alignItems: 'center' },
                  children: post.data.title,
                }
              },
              {
                type: 'div',
                props: {
                  style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '32px', color: '#94a3b8' },
                  children: [
                    { type: 'span', props: { children: 'DevScrolls' } },
                    { type: 'span', props: { children: 'Santhanakrishnan' } }
                  ]
                }
              }
            ]
          }
        }
      }
    },
    {
      width: 1200,
      height: 630,
      fonts: fontData ? [
        {
          name: 'Inter',
          data: fontData,
          weight: 700,
          style: 'normal',
        },
      ] : [],
    }
  );

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  const pngData = resvg.render().asPng();

  return new Response(pngData, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
