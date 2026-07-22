export const GET = () => {
  const payload = {
    title: 'NØX API documentation',
    description:
      'Machine-readable discovery document for the NØX chat experience.',
    endpoints: [
      {
        path: '/api/chat',
        methods: ['POST'],
        description: 'Chat completion endpoint for the assistant experience.',
      },
      {
        path: '/health',
        methods: ['GET'],
        description: 'Simple liveness endpoint.',
      },
      {
        path: '/privacy',
        methods: ['GET'],
        description: 'Privacy policy page.',
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
