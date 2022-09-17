/**
 * Netlify function: Read RSS from url and return it as JSON
 * > As of version 1.11.0 (and the end of webtask.io) this serverless function was migrated to Netlify
 * > Called: http://localhost:8888/.netlify/functions/getrss?alias={someAlias}&url={someRSSUrl}
 */

const Parser = require('rss-parser');
const parser = new Parser({
  customFields: {
    item: [
      ['slash:comments', 'commentCount'],
      ['thr:total', 'commentCount'],
      ['atom:summary', 'contentSnippet'],
      ['post-id', 'postid']
    ]
  }
});

exports.handler = async (event, context) => {
  try {
    const ref = event.headers.referrer || 'none';
    console.log(`Referrer: ${ref}`);

    const alias = event.queryStringParameters?.alias;
    if (!alias) throw new Error('Missing alias');
    const appUsers = process.env.APPUSER.split('|');

    const prod = ref.match(/https?:\/\/.*\.twoday\.net\/?/);
    const dev = ref.match(/https?:\/\/.*\.twoday-test\.click\/?/);
    const approved = (prod || dev) && appUsers.includes(alias);
    if (!approved) throw new Error('Inappropriate origin/alias');

    const url = event.queryStringParameters?.url;
    if (!url) throw new Error('Missing RSS url');

    const feed = await parser.parseURL(url);
    return {
      statusCode: 200,
      body: JSON.stringify(feed)
    };
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Error while reading RSS feed: ${err}.` })
    };
  }
};
