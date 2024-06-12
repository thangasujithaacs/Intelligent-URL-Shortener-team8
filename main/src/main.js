import AppwriteService from './appwrite.js';
import { generateShortCode, throwIfMissing } from './utils.js';
import dotenv from 'dotenv';
dotenv.config();

export default async ({ res, req, log, error }) => {

  const appwrite = new AppwriteService();
  console.log(req.method)
    try {
      throwIfMissing(req.body, ['url']);
      new URL(req.body.url);
    } catch (err) {
      error(err.message);
      return res.send({ ok: false, error: err.message }, 400);
    }
    const urlEntry = await appwrite.createURLEntry(
      req.body.url,
      req.body.shortCode ?? generateShortCode(),
      req.body.expirationDate // Pass expiration date to the createURLEntry method
    );
    
    if (!urlEntry) {
      error('Failed to create url entry.');
      return res.json({ success: false, error: 'Failed to create url entry' }, 500);
    }
    
    //generate qr code
    try{
      const shortenedURL =  new URL(urlEntry.$id, process.env.SHORT_BASE_URL).toString()
      // const qrCodeFileId = await appwrite.generateQRCode(shortenedURL);
      return res.json({
        short: shortenedURL,
        short_code: urlEntry.$id,
        // qrCodeFileId: qrCodeFileId
      });
    }
    catch (err) {
      error(err.message);
      return res.send({ success: false, error: err.message }, 400);
    }

  }

  if (req.method === 'GET' && req.path.startsWith('/analytics/')) {
    const shortId = req.path.replace(/^\/analytics\//, '');
    const analyticsData = await appwrite.getAnalyticsData(shortId);

    if (!analyticsData) {
      return res.send('Failed to fetch analytics data.', 500);
    }

    return res.json({ ok: true, data: analyticsData });
  }

  const shortId = req.path.replace(/^(\/)|(\/)$/g, '');
  log(`Fetching document from with ID: ${shortId}`);

  const urlEntry = await appwrite.getURLEntry(shortId);

  if (!urlEntry) {
    return res.send('Invalid link.', 404);
  }

  const analyticsData = {
    geoLocation: req.headers['x-appwrite-locale'] || 'unknown',
    deviceType: req.headers['user-agent'] || 'unknown',
    referrer: req.headers['referer'] || 'direct',
  };

  // Log the click
  await appwrite.logClick(shortId, analyticsData);

  return res.redirect(urlEntry.url);