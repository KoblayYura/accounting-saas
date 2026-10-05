// src/modules/clients/clients.controller.js
// HTTP-шар clients-модуля: ручна валідація → виклик service → { success, data }.
// Помилки прокидаються в next() → централізований error-handler (422 для ValidationError).

const { sendSuccess } = require('../../utils/api-response');
const clientsService = require('./clients.service');
const {
  validateCreateClient,
  validateUpdateClient,
  validateClientId,
  validateListQuery,
} = require('./clients.validation');

const list = async (req, res, next) => {
  try {
    const query = validateListQuery(req.query);
    const result = await clientsService.listClients(req.accountantId, query);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const id = validateClientId(req.params);
    const client = await clientsService.getClientById(req.accountantId, id);
    sendSuccess(res, client);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const dto = validateCreateClient(req.body);
    const client = await clientsService.createClient(req.accountantId, dto);
    sendSuccess(res, client, 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const id = validateClientId(req.params);
    const dto = validateUpdateClient(req.body);
    const client = await clientsService.updateClient(req.accountantId, id, dto);
    sendSuccess(res, client);
  } catch (err) {
    next(err);
  }
};

/** Soft-delete (архівація). 204 без тіла — конвенція зі спеки для DELETE. */
const archive = async (req, res, next) => {
  try {
    const id = validateClientId(req.params);
    await clientsService.archiveClient(req.accountantId, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const restore = async (req, res, next) => {
  try {
    const id = validateClientId(req.params);
    const client = await clientsService.restoreClient(req.accountantId, id);
    sendSuccess(res, client);
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, create, update, archive, restore };
