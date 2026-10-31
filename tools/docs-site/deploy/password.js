// The docs site behind one shared password (bin/deploy <project> --password).
// The browser's own sign-in box asks for it (HTTP Basic auth); any user name
// is accepted. The password is the Worker's secret PASSWORD, set with
// `npx wrangler secret put PASSWORD --name <project>-docs`, never written here.
// With no secret set, nothing is served: a missing password must not mean an
// open site.
export default {
  async fetch(request, env) {
    const given = (request.headers.get('Authorization') || '').match(/^Basic\s+(.+)$/i);
    const password = given ? atob(given[1]).split(':').slice(1).join(':') : null;
    if (env.PASSWORD && password !== null && await same(password, env.PASSWORD)) return env.ASSETS.fetch(request);
    return new Response(env.PASSWORD ? 'Password required' : 'No password set for this site yet', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Docs", charset="UTF-8"', 'Cache-Control': 'no-store' },
    });
  },
};

// Compared as hashes, so the time taken says nothing about how much matched.
async function same(a, b) {
  const h = async (s) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
  const [x, y] = await Promise.all([h(a), h(b)]);
  return x.every((v, i) => v === y[i]);
}
