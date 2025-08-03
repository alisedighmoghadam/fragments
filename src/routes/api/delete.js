const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

module.exports = async (req, res) => {
  const { id } = req.params;
  logger.info(`Delete request received for fragment id: ${id} by user ${req.user}`);

  try {
    const fragment = await Fragment.byId(req.user, id);
    if (!fragment) {
      logger.warn(`Fragment not found with id: ${id} for user ${req.user}`);
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    await Fragment.delete(req.user, id);
    logger.info(`Fragment with id: ${id} deleted successfully`);
    res.status(200).json(createSuccessResponse({ message: 'Fragment deleted' }));
  } catch (err) {
    logger.error(err, `Error deleting fragment with id: ${id}`);
    res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
