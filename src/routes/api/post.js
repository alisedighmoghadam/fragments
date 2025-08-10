const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');
module.exports = async (req, res) => {
  logger.info('Fragment post received successfully.');
  const contentType = req.headers['content-type'];
  const contentLength = req.headers[`Content-Length`];
  if (Buffer.isBuffer(req.body)) {
    logger.info(
      `Getting req body ownerId=${req.user}, type=${contentType} and size=${contentLength}`
    );
    var fragment = new Fragment({
      ownerId: req.user,
      type: contentType,
      size: contentLength,
    });
    fragment.setData(req.body);
    await fragment.save();
    logger.debug({ fragment }, 'fragment instance saved.');

    const baseUrl = process.env.API_URL || `http://${req.headers.host}`;
    const location = new URL(`v1/fragments/${fragment.id}`, baseUrl);

    res.setHeader('location', location.toString());
    res.status(201).json(createSuccessResponse(fragment));
    return;
  }
  logger.error(`Unsupported content type: ${contentType}`);
  res.status(415).json(createErrorResponse(`Unsupported content type: ${contentType}`));
};
