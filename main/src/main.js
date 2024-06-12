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
  console.log(req.method)
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
        short_code: urlEntry.$id,
        // qrCodeFileId: qrCodeFileId
      });
    }
    catch (err) {
      error(err.message);
      return res.send({ success: false, error: err.message }, 400);
    }
    
    
};
