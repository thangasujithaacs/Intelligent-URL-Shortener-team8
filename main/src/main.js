import AppwriteService from './appwrite.js';
import { generateShortCode, throwIfMissing } from './utils.js';

export default async ({ res, req, log, error }) => {
  // throwIfMissing(process.env, [
  //   'APPWRITE_API_KEY',
  //   'APPWRITE_DATABASE_ID',
  //   'APPWRITE_COLLECTION_ID',
  //   'SHORT_BASE_URL',
  // ]);
  APPWRITE_ENDPOINT = 'https://666929b7a6ef5e0c39d7.appwrite.global/v1';
  APPWRITE_FUNCTION_PROJECT_ID = '666920d300249f8d0648';
  APPWRITE_API_KEY = '758864a5964046685133c6d8a55d320ea493de1b0edc9492231883554e5a7200dfd2e6d9aed00defdec0ca3d32830c761c48c6b2626659abb1d09bcc992f98f84a73ce31566400d77f70c696e56b02e5f219ae8d9030771780771d96b7b540bbf884661a02313d4845ec3057530842e35f06f743e215588b0aa483913c5abc5f';
  APPWRITE_DATABASE_ID = '666926460035dca8000d';
  APPWRITE_COLLECTION_ID = '6669267e000a824e00b9';
  SHORT_BASE_URL = 'https://url-shortner.io';
  
  const appwrite = new AppwriteService();

  if (
    req.method === 'POST' &&
    req.headers['content-type'] === 'application/json'
  ) {
    try {
      throwIfMissing(req.body, ['url']);
      new URL(req.body.url);
    } catch (err) {
      error(err.message);
      return res.send({ ok: false, error: err.message }, 400);
    }
    console.log("Hello, world!");
    const urlEntry = await appwrite.createURLEntry(
      req.body.url,
      req.body.shortCode ?? generateShortCode()
    );
    if (!urlEntry) {
      error('Failed to create url entry.');
      return res.json({ ok: false, error: 'Failed to create url entry' }, 500);
    }

    return res.json({
      short: new URL(urlEntry.$id, process.env.SHORT_BASE_URL).toString(),
    });
  }

  const shortId = req.path.replace(/^(\/)|(\/)$/g, '');
  log(`Fetching document from with ID: ${shortId}`);

  const urlEntry = await appwrite.getURLEntry(shortId);

  if (!urlEntry) {
    return res.send('Invalid link.', 404);
  }

  return res.redirect(urlEntry.url);
};
