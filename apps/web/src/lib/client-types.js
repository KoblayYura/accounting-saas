// src/lib/client-types.js
// Єдине джерело правди про типи клієнта на фронті: i18n-ключі підписів + колір бейджа.
// Використовується ClientTypeBadge, ClientTypeSelect і фільтром на /clients — щоб
// не дублювати перелік у кожному компоненті (DRY).

/**
 * bg — варіант React Bootstrap Badge (bg="...").
 * labelKey / shortLabelKey — ключі next-intl у секції clients.*
 */
export const CLIENT_TYPES = {
  fop_group_1: { labelKey: 'typeFop1', shortLabelKey: 'typeFop1Short', bg: 'info' },
  fop_group_2: { labelKey: 'typeFop2', shortLabelKey: 'typeFop2Short', bg: 'success' },
  fop_group_3: { labelKey: 'typeFop3', shortLabelKey: 'typeFop3Short', bg: 'primary' },
  fop_general: { labelKey: 'typeFopGeneral', shortLabelKey: 'typeFopGeneralShort', bg: 'info' },
  tov: { labelKey: 'typeTov', shortLabelKey: 'typeTovShort', bg: 'warning' },
  tov_general: { labelKey: 'typeTovGeneral', shortLabelKey: 'typeTovGeneralShort', bg: 'warning' },
  pp: { labelKey: 'typePp', shortLabelKey: 'typePpShort', bg: 'warning' },
  self_employed: { labelKey: 'typeSelfEmployed', shortLabelKey: 'typeSelfEmployedShort', bg: 'secondary' },
  public_organization: { labelKey: 'typePublicOrg', shortLabelKey: 'typePublicOrgShort', bg: 'dark' },
  charity_fund: { labelKey: 'typeCharityFund', shortLabelKey: 'typeCharityFundShort', bg: 'dark' },
  osbb: { labelKey: 'typeOsbb', shortLabelKey: 'typeOsbbShort', bg: 'secondary' },
};

/** Порядок показу типів у select/фільтрі (значення enum). Підпис резолвиться через i18n. */
export const CLIENT_TYPE_ORDER = Object.keys(CLIENT_TYPES);
