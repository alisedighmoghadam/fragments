const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const { createErrorResponse, createSuccessResponse } = require('../../response');

module.exports = async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user;
  const contentType = req.headers['content-type'];

  try {
    const fragment = await Fragment.byId(ownerId, id);

    if (!fragment) {
      logger.error(`No fragment with id:${id} exist`);
      return res.status(404).json(createErrorResponse(404, `No fragment with id:${id} exist`));
    }

    if (contentType != fragment.type) {
      logger.error(`Cannot change the type of the fragment!`);
      return res
        .status(400)
        .json(createErrorResponse(400, `Cannot change the type of the fragment`));
    }

    logger.info(`Fragment with id: ${id} being updated body: ${req.body}`);
    fragment.setData(req.body);
    fragment.save();
    res.status(200).json(createSuccessResponse(fragment));
  } catch (err) {
    logger.error(err, `Error updating fragment ${id}`);
    return res.status(500).json(createErrorResponse(500, `Error updating fragment ${id}`));
  }
};
