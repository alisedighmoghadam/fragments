const { Fragment } = require('../../model/fragment');
const markdownIt = require('markdown-it');
const md = new markdownIt();
const logger = require('../../logger');

module.exports = async (req, res) => {
  const { id, ext } = req.params;
  const ownerId = req.user;

  try {
    const fragment = await Fragment.byId(ownerId, id);
    const data = await fragment.getData();

    // Only support .html for now
    if (ext === 'html' && fragment.mimeType === 'text/markdown') {
      const html = md.render(data.toString());
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    }

    // If ext matches the original type, just return raw data
    if (ext === 'md' && fragment.mimeType === 'text/markdown') {
      res.setHeader('Content-Type', 'text/markdown');
      return res.status(200).send(data);
    }

    return res.status(415).json({ status: 'error', message: `Cannot convert to .${ext}` });
  } catch (err) {
    logger.error(err, `Error processing fragment ${id} with extension ${ext}`);
    return res.status(404).json({ status: 'error', message: 'Fragment not found' });
  }
};
