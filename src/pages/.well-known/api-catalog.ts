export const GET = () => {
  const payload = {
    title: 'NØX API catalog',
    description: 'Machine-readable catalog for agent discovery.',
    resources: [
      {
        rel: 'service-doc',
        href: '/docs/api',
        type: 'application/json',
      },
      {
        rel: 'describedby',
        href: '/health',
        type: 'application/json',
      },
    ],
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
