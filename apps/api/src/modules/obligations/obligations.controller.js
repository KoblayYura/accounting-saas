// src/modules/obligations/obligations.controller.js
// HTTP-шар obligations-модуля: ручна валідація → виклик service → { success, data }.
// Помилки прокидаються в next() → централізований error-handler (422 для ValidationError).

const { sendSuccess } = require('../../utils/api-response');
const obligationsService = require('./obligations.service');
const {
  validateObligationId,
  validateListQuery,
  validateCreateObligation,
  validateUpdateObligation,
  validateStatus,
  parseForce,
} = require('./obligations.validation');

const list = async (req, res, next) => {
  try {
    const query = validateListQuery(req.query);
    const result = await obligationsService.listObligations(req.accountantId, query);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = validateObligationId(req.params);
    const obligation = await obligationsService.getObligationById(req.accountantId, id);
    sendSuccess(res, obligation);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const dto = validateCreateObligation(req.body);
    const obligation = await obligationsService.createManualObligation(req.accountantId, dto);
    sendSuccess(res, obligation, 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = validateObligationId(req.params);
    const dto = validateUpdateObligation(req.body);
    const obligation = await obligationsService.updateObligation(req.accountantId, id, dto);
    sendSuccess(res, obligation);
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id } = validateObligationId(req.params);
    const dto = validateStatus(req.body);
    const force = parseForce(req.query);
    const obligation = await obligationsService.updateObligationStatus(
      req.accountantId,
      id,
      dto,
      force,
    );
    sendSuccess(res, obligation);
  } catch (err) {
    next(err);
  }
};

/** Hard delete. 204 без тіла — конвенція для DELETE. 409, якщо є історія сповіщень. */
const remove = async (req, res, next) => {
  try {
    const { id } = validateObligationId(req.params);
    await obligationsService.removeObligation(req.accountantId, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, create, update, updateStatus, remove };
