import AppwriteService from './appwrite.js';
import { generateShortCode, throwIfMissing } from './utils.js';
// import cors from 'cors';


export default async ({ res, req, log, error }) => {
  throwIfMissing(process.env, [
    'APPWRITE_API_KEY',
    'APPWRITE_DATABASE_ID',
    'APPWRITE_COLLECTION_ID',
    'SHORT_BASE_URL',
  ]);
  const appwrite = new AppwriteService();
  switch (req.method) {
    case 'PATCH':
        if (req.method === 'PATCH' && req.headers['content-type'] === 'application/json') {
          try {
            throwIfMissing(req.body, ['shortId']);
            const updates = {};
            if (req.body.newShortCode) {
              updates.shortCode = req.body.newShortCode;
            }
            if (req.body.expirationDate) {
              updates.expirationDate = req.body.expirationDate;
            }
            const updatedEntry = await appwrite.updateURLEntry(req.body.shortId, updates);
            if (!updatedEntry) {
              error('Failed to update URL entry.');
              return res.json({ ok: false, error: 'Failed to update URL entry' }, 500);
            }
            return res.json({ ok: true, url: updatedEntry });
          } catch (err) {
            error(err.message);
            return res.send({ ok: false, error: err.message }, 400);
          }
      }

    case 'GET':
        const shortId = req.path.replace(/^(\/)|(\/)$/g, '');
        log(`Fetching document with ID: ${shortId}`);
 
        const urlEntryGET = await appwrite.getURLEntry(shortId);
 
        if (!urlEntryGET) {
          return res.send('Invalid link.', 404);
        }
 
        if (urlEntryGET.expirationDate && new Date() > new Date(urlEntryGET.expirationDate)) {
          return res.send('This link has expired.', 410); // 410 - Gone status code indicates the resource is no longer available
        }
 
        return res.redirect(urlEntryGET.url);
    case 'POST':
  // console.log(req.method)
      try {
        throwIfMissing(req.body, ['url']);
        new URL(req.body.url);
      } catch (err) {
        error(err.message);
        return res.send({ ok: false, error: err.message }, 400);
      }
      const expirationDate = req.body.expirationDate || null; // Extract expiration date from request body

      console.log("Hello, world!");
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
          shortCode: req.body.shortCode,
          // qrCodeFileId: qrCodeFileId
        });
      }
      catch (err) {
        error(err.message);
        return res.send({ success: false, error: err.message }, 400);
      }

    default:
      return res.send({ success: false, error: 'Method not allowed' }, 405);
  }

    
};
