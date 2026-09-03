'use strict'

// =============================================================================
// MODE 1 — MODULAR STRUCTURE (New Approach)
// Each hook lives in its own file under its own folder
// =============================================================================

// import { isVisible, isEditable } from './pageSecurityPlugin/psp'
// import { init } from './onInit/init'
// import { beforeCalculate } from './onBeforeCalculate/beforeCalculate'
// import { beforePriceRules } from './onBeforePriceRules/beforePriceRules'
// import { afterPriceRules } from './onAfterPriceRules/afterPriceRules'
// import { afterCalculate } from './onAfterCalculate/afterCalculate'

// export function isFieldVisibleForObject(fieldName, object, conn, objectName) {
//     return isVisible(fieldName, object, conn, objectName);
// }

// export function isFieldEditableForObject(fieldName, object, conn, objectName) {
//     return isEditable(fieldName, object, conn, objectName);
// }

// export function onInit(quoteLineModels, conn) {
//     return init(quoteLineModels, conn);
// }

// export async function onBeforeCalculate(quoteModel, quoteLineModels, conn) {
//     return beforeCalculate(quoteModel, quoteLineModels, conn);
// }

// export function onBeforePriceRules(quoteModel, quoteLineModels, conn) {
//     return beforePriceRules(quoteModel, quoteLineModels, conn);
// }

// export function onAfterPriceRules(quoteModel, quoteLineModels, conn) {
//     return afterPriceRules(quoteModel, quoteLineModels, conn);
// }

// export function onAfterCalculate(quoteModel, quoteLineModels, conn) {
//     return afterCalculate(quoteModel, quoteLineModels, conn);
// }

// =============================================================================
// MODE 2 — LEGACY SINGLE FILE (Old Approach)
// Everything in one file — legacyCalculatorScript.js
// =============================================================================

import {isFieldVisibleForObject,isFieldEditableForObject,onInit,onBeforeCalculate,onBeforePriceRules,onAfterPriceRules,onAfterCalculate} from './util/legacyCalculatorScript'

export {isFieldVisibleForObject,isFieldEditableForObject,onInit,onBeforeCalculate,onBeforePriceRules,onAfterPriceRules,onAfterCalculate}
