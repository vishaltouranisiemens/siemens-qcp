'use strict'

import { calculateEndDate, getEffectiveSubscriptionTerm, toApexDate, monthsBetween } from '../util/helperFunctions'

function validateMaintLinesForPerpetual(quoteLineModels, sourceToClonedMap, extendLines, maintLicenseTypes, extendLicenseTypes, existingQuoteLineSourceByLineId) {
    var MAINT_ERROR_MESSAGE = ' ERROR: Maintenance license type must be created by Extended automation (no standalone Maintenance lines).'; // CR-037305
    var MAINT_ONLY_ONE_ERROR_MESSAGE = ' ERROR: A perpetual line can have only one maintenance line.';
    var MAINT_ERROR_DATE_RANGE_MESSAGE = ' ERROR: Maintenance period cannot be more than 12 months.';
    var EXTEND_ALERT_MESSAGE = ' ALERT: Click Quick Save to add the maintenance line for this product (initial add only; not after manual maint line deletion).';
    var EXTEND_ALERT_MESSAGE_REMOVE = ' ALERT: Perpetual line is being removed. Please click "Quick Save" to remove this maintenance line as well.';
    var WARRANTY_INCLUDED_ALERT_MESSAGE = ' ALERT: Warranty Included ';
    const lineByIdForSource = new Map();
    const maintSourceIdSet = new Set();
    const currentQuoteLineIdSet = new Set();
    for (let ql of quoteLineModels) {
        if (ql.record && ql.record.Id) {
            currentQuoteLineIdSet.add(ql.record.Id);
        }
    }

    quoteLineModels.forEach((line) => {
        //034854
        line.record.Error_Alert__c = (line.record.Error_Alert__c || '')
            .replace(' ' + WARRANTY_INCLUDED_ALERT_MESSAGE, '')
            .replace(WARRANTY_INCLUDED_ALERT_MESSAGE, '')
            .trim();
        if (line.record.Id) {
            lineByIdForSource.set(line.record.Id, line);
        }
        const licenseType = line.record["CPQ_License_Type__c"] ? line.record["CPQ_License_Type__c"].toUpperCase() : '';
        if (line.record["SBQQ__Source__c"] && licenseType && maintLicenseTypes.has(licenseType)) {
            maintSourceIdSet.add(line.record["SBQQ__Source__c"]);
        }

        if (line.record.PRMES_Product_Type__c === 'LM' && line.record.CPQ_License_Type__c && maintLicenseTypes.has(line.record.CPQ_License_Type__c.toUpperCase())) {
            if (!line.record.SBQQ__Source__c) {
                const lineId = line.record.Id;
                const persistedSourceId = lineId && existingQuoteLineSourceByLineId ? existingQuoteLineSourceByLineId[lineId] : null;
                const sourceLineRemovedFromModel = persistedSourceId && !currentQuoteLineIdSet.has(persistedSourceId);

                if (sourceLineRemovedFromModel) {
                    line.record.SBQQ__Quantity__c = 0;
                    line.record.Error_Alert__c = EXTEND_ALERT_MESSAGE_REMOVE;
                } else {
                    line.record.Error_Alert__c = (line.record.Error_Alert__c || '') + MAINT_ERROR_MESSAGE;
                }
            }
            else if (line.record.SBQQ__Source__c && !extendLines.has(line.record.SBQQ__Source__c)) {
                line.record.Error_Alert__c = (line.record.Error_Alert__c || '') + MAINT_ERROR_MESSAGE;
            }
            else if (line.record.SBQQ__Source__c && extendLines.has(line.record.SBQQ__Source__c)) {
                let clonedLines = sourceToClonedMap.get(line.record.SBQQ__Source__c);
                if (clonedLines && clonedLines.size > 1) {
                    let flag = false;
                    for (let clonedLine of clonedLines) {
                        if (!clonedLine.record.Id) {
                            flag = true;
                            clonedLine.record.Error_Alert__c = (clonedLine.record.Error_Alert__c || '') + MAINT_ONLY_ONE_ERROR_MESSAGE;
                        }
                    }
                    if (!flag) {
                        line.record.Error_Alert__c = (line.record.Error_Alert__c || '') + MAINT_ONLY_ONE_ERROR_MESSAGE;
                    }
                }
                sourceToClonedMap.delete(line.record.SBQQ__Source__c);
            }
            if (line.record.SBQQ__EffectiveStartDate__c && line.record.True_Effective_End_Date__c) {
                let months = monthsBetween(new Date(line.record.SBQQ__EffectiveStartDate__c), new Date(line.record.True_Effective_End_Date__c));
                if (months > 11) {
                    line.record.Error_Alert__c = (line.record.Error_Alert__c || '') + MAINT_ERROR_DATE_RANGE_MESSAGE;
                }
            }
        }

        if (line.record.Id && extendLines.has(line.record.Id) && !sourceToClonedMap.has(line.record.Id)) {
            line.record.Error_Alert__c = (line.record.Error_Alert__c || '') + EXTEND_ALERT_MESSAGE;
        }
        if (!line.record.Id && line.record.PRMES_Product_Type__c === 'LM' && line.record.CPQ_License_Type__c && extendLicenseTypes.has(line.record.CPQ_License_Type__c.toUpperCase())) {
            line.record.Error_Alert__c = (line.record.Error_Alert__c || '') + EXTEND_ALERT_MESSAGE;
        }

        //034854
        if (line.record.PRMES_Product_Type__c === 'MO') {
            line.record.Error_Alert__c = (line.record.Error_Alert__c || '') + WARRANTY_INCLUDED_ALERT_MESSAGE;
        }
    });

    const EXTEND_LOCK_ERROR_MESSAGE = ' ERROR: CPQ License Type cannot be changed from Extended while an associated Maintenance line exists. Delete the Extended line to remove both lines.';
    for (const sourceId of maintSourceIdSet) {
        const sourceLine = lineByIdForSource.get(sourceId);
        if (!sourceLine) {
            continue;
        }
        const sourceLicense = sourceLine.record["CPQ_License_Type__c"] ? sourceLine.record["CPQ_License_Type__c"].toUpperCase() : '';
        if (!sourceLicense || !extendLicenseTypes.has(sourceLicense)) {
            sourceLine.record.Error_Alert__c = (sourceLine.record.Error_Alert__c || '') + EXTEND_LOCK_ERROR_MESSAGE;
        }
    }
}

function stampOriginalGroupId(quoteModel, quoteLineModels) {
    if (quoteModel.groups.length != 0) {
        if (
            quoteModel.record["SBQQ__Type__c"] === "Quote" ||
            quoteModel.record["SBQQ__Type__c"] === "Renewal"
        ) {
            quoteLineModels.forEach((line) => {
                line.record["Original_Group_Id__c"] =
                    quoteModel.record["Name"] +
                    "-" +
                    line.group.record["SBQQ__Number__c"];
            });

            quoteModel.groups.forEach((group) => {
                group.record["Original_Group_Id__c"] =
                    quoteModel.record["Name"] + "-" + group.record["SBQQ__Number__c"];
            });

        } else if (quoteModel.record["SBQQ__Type__c"] === "Amendment") {
            let ogGroupMap = {};

            quoteLineModels.forEach((line) => {
                if (line.record["Original_Group_Id__c"] != null) {
                    ogGroupMap[line.parentGroupKey] = line.record["Original_Group_Id__c"];
                }
            });

            quoteLineModels.forEach((line) => {
                if (
                    line.parentGroupKey in ogGroupMap &&
                    !line.record["Original_Group_Id__c"]
                ) {
                    line.record["Original_Group_Id__c"] = ogGroupMap[line.parentGroupKey];
                }
            });

            quoteModel.groups.forEach((group) => {
                group.record["Original_Group_Id__c"] = ogGroupMap[group.key];
            });
        }
    }
}

function calculateAcv(quote, quoteLines) {
    let rampGroups = [];
    let acv = 0.0;
    let rampGroupMap = {};
    let rampTotal = 0.0;

    quote.groups.forEach((group) => {
        if (group.record["Ramp_Group__c"]) {
            rampGroups.push(group);
            rampTotal += group.NetTotal__c;
        }
    });

    rampGroups.forEach((group) => {
        let percentOfTotal = (group.NetTotal__c / rampTotal) * 100;
        group.record["Ramp_Percentage_of_Revenue__c"] = Number(percentOfTotal.toFixed(2));
    });

    quoteLines.forEach((quoteLine) => {
        // CR-030811
        if (quoteLine.record["Ramp_Key__c"]) {
            let rampData = rampGroupMap[quoteLine.record["Ramp_Key__c"]];
            if (!rampData) {
                rampData = { total: 0.0, numLines: 0 };
            }
            rampData["numLines"]++;
            let currentAcv = quoteLine.record["Current_ACV_12_Mth__c"] || 0;
            rampData.total += currentAcv;
            rampGroupMap[quoteLine.record["Ramp_Key__c"]] = rampData;
        } else {
            let currentAcv = quoteLine.record["Current_ACV_12_Mth__c"] || 0;
            acv += currentAcv;
        }
    });

    if (rampGroupMap) {
        quoteLines.forEach((quoteLine) => {
            if (quoteLine.record["Ramp_Key__c"]) {
                let rampData = rampGroupMap[quoteLine.record["Ramp_Key__c"]];
                quoteLine.record["Ramp_Average_Price__c"] = Number((rampData.total / rampData.numLines).toFixed(2));
            }
        });

        for (const key in rampGroupMap) {
            let rampData = rampGroupMap[key];
            acv += rampData["total"] / rampData["numLines"];
        }
    }

    quote.record["ACV__c"] = acv;
}

function calculateSaspOverage(categoryTotals, Sasp_Categories) {
    const categoryThresholds = {
        [Sasp_Categories.SAAS]: { low: 0.3, high: 0.15 },
        [Sasp_Categories.LAAS]: { low: 0.26, high: 0.13 }
    };

    let overage = 0.0;
    let lowDiscount;
    let targetSaasAmt = 0;
    let targetLaasAmt = 0;

    let potSaasReallocation = 0.0;
    let potLaasReallocation = 0;
    let potHsaasReallocation = 0;
    let potXTReallocation = 0;

    let totalNonSaas = 0;
    let totalPotential = 0;
    let saasReallocationNeeded = 0;
    let laasReallocationNeeded = 0;
    let totalReallocationNeeded = 0;

    let saasReallocation = 0;
    let laasReallocation = 0;
    let hsaasReallocation = 0;
    let xtReallocation = 0;

    if (categoryTotals[Sasp_Categories.SAAS]) {
        lowDiscount = categoryTotals[Sasp_Categories.SAAS]["total"] * categoryThresholds[Sasp_Categories.SAAS]["low"];

        if (categoryTotals[Sasp_Categories.SAAS]["discount"] > lowDiscount) {
            targetSaasAmt = categoryTotals[Sasp_Categories.SAAS]["total"] * (1 - categoryThresholds[Sasp_Categories.SAAS]["high"]);
            if (targetSaasAmt > 0) {
                saasReallocationNeeded = targetSaasAmt - categoryTotals[Sasp_Categories.SAAS]["netTotal"];
                totalReallocationNeeded += saasReallocationNeeded;
                overage += targetSaasAmt - categoryTotals[Sasp_Categories.SAAS]["netTotal"];
            }
        }
    }

    if (categoryTotals[Sasp_Categories.LAAS]) {
        lowDiscount = categoryTotals[Sasp_Categories.LAAS]["total"] * categoryThresholds[Sasp_Categories.LAAS]["low"];

        if (categoryTotals[Sasp_Categories.LAAS]["discount"] > lowDiscount) {
            targetLaasAmt = categoryTotals[Sasp_Categories.LAAS]["total"] * (1 - categoryThresholds[Sasp_Categories.LAAS]["high"]);
            if (targetLaasAmt > 0) {
                laasReallocationNeeded = targetLaasAmt - categoryTotals[Sasp_Categories.LAAS]["netTotal"];
                totalReallocationNeeded += laasReallocationNeeded;
                overage += targetLaasAmt - categoryTotals[Sasp_Categories.LAAS]["netTotal"];
            }
        }
    }

    if (totalReallocationNeeded > 0) {
        if (categoryTotals[Sasp_Categories.SAAS])
            categoryTotals[Sasp_Categories.SAAS]["allocationPct"] = saasReallocationNeeded > 0 ? saasReallocationNeeded / totalReallocationNeeded : 0;
        if (categoryTotals[Sasp_Categories.LAAS])
            categoryTotals[Sasp_Categories.LAAS]["allocationPct"] = laasReallocationNeeded > 0 ? laasReallocationNeeded / totalReallocationNeeded : 0;
    }

    if (categoryTotals[Sasp_Categories.LAAS]) {
        if (targetLaasAmt > 0) {
            potLaasReallocation = 0;
        } else {
            potLaasReallocation = categoryTotals[Sasp_Categories.LAAS]["netTotal"] - (categoryTotals[Sasp_Categories.LAAS]["total"] * (1 - categoryThresholds[Sasp_Categories.LAAS]["low"]));
            categoryTotals[Sasp_Categories.LAAS]["potReallocation"] = potLaasReallocation;
            totalPotential += potLaasReallocation;
        }
    }

    if (categoryTotals[Sasp_Categories.SAAS]) {
        if (targetSaasAmt > 0) {
            potSaasReallocation = 0;
        } else {
            potSaasReallocation = categoryTotals[Sasp_Categories.SAAS]["netTotal"] - (categoryTotals[Sasp_Categories.SAAS]["total"] * (1 - categoryThresholds[Sasp_Categories.SAAS]["low"]));
            categoryTotals[Sasp_Categories.SAAS]["potReallocation"] = potSaasReallocation;
            totalPotential += potSaasReallocation;
        }
    }

    if (categoryTotals[Sasp_Categories.HSAAS]) {
        potHsaasReallocation = categoryTotals[Sasp_Categories.HSAAS]["netTotal"];
        categoryTotals[Sasp_Categories.HSAAS]["potReallocation"] = potHsaasReallocation;
        totalNonSaas += potHsaasReallocation;
        totalPotential += potHsaasReallocation;
    }

    if (categoryTotals[Sasp_Categories.XT]) {
        potXTReallocation = categoryTotals[Sasp_Categories.XT]["netTotal"];
        categoryTotals[Sasp_Categories.XT]["potReallocation"] = potXTReallocation;
        totalNonSaas += potXTReallocation;
        totalPotential += potXTReallocation;

        if (totalNonSaas < totalReallocationNeeded) {
            xtReallocation = -potXTReallocation;
            categoryTotals[Sasp_Categories.XT]["reallocation"] = xtReallocation;
        } else {
            xtReallocation = -1 * ((potXTReallocation / totalNonSaas) * totalReallocationNeeded);
            categoryTotals[Sasp_Categories.XT]["reallocation"] = xtReallocation;
        }
    }

    if (categoryTotals[Sasp_Categories.HSAAS]) {
        if (totalNonSaas < totalReallocationNeeded) {
            hsaasReallocation = -potHsaasReallocation;
            categoryTotals[Sasp_Categories.HSAAS]["reallocation"] = hsaasReallocation;
        } else {
            hsaasReallocation = -1 * ((potHsaasReallocation / totalNonSaas) * totalReallocationNeeded);
            categoryTotals[Sasp_Categories.HSAAS]["reallocation"] = hsaasReallocation;
        }
    }

    if (categoryTotals[Sasp_Categories.LAAS]) {
        if (laasReallocationNeeded > 0) {
            if (totalPotential < totalReallocationNeeded) {
                laasReallocation = categoryTotals[Sasp_Categories.LAAS].allocationPct * totalPotential;
                categoryTotals[Sasp_Categories.LAAS]["reallocation"] = laasReallocation;
            } else {
                laasReallocation = laasReallocationNeeded;
                categoryTotals[Sasp_Categories.LAAS]["reallocation"] = laasReallocation;
            }
        } else {
            if (potLaasReallocation > 0 && totalNonSaas <= totalReallocationNeeded) {
                if (potLaasReallocation < (totalReallocationNeeded - totalNonSaas)) {
                    laasReallocation = -potLaasReallocation;
                    categoryTotals[Sasp_Categories.LAAS]["reallocation"] = laasReallocation;
                }
            } else {
                laasReallocation = 0;
                categoryTotals[Sasp_Categories.LAAS]["reallocation"] = laasReallocation;
            }
        }
    }

    if (categoryTotals[Sasp_Categories.SAAS]) {
        if (saasReallocationNeeded > 0) {
            if (totalPotential < totalReallocationNeeded) {
                saasReallocation = categoryTotals[Sasp_Categories.SAAS].allocationPct * totalPotential;
                categoryTotals[Sasp_Categories.SAAS]["reallocation"] = saasReallocation;
            } else {
                saasReallocation = saasReallocationNeeded;
                categoryTotals[Sasp_Categories.SAAS]["reallocation"] = saasReallocation;
            }
        } else {
            if (potSaasReallocation > 0 && totalNonSaas <= totalReallocationNeeded) {
                if (potSaasReallocation > totalReallocationNeeded - totalNonSaas) {
                    saasReallocation = -1 * (laasReallocation + hsaasReallocation + xtReallocation);
                    categoryTotals[Sasp_Categories.SAAS]["reallocation"] = saasReallocation;
                } else {
                    saasReallocation = -potSaasReallocation;
                    categoryTotals[Sasp_Categories.SAAS]["reallocation"] = saasReallocation;
                }
            } else {
                saasReallocation = 0;
                categoryTotals[Sasp_Categories.SAAS]["reallocation"] = saasReallocation;
            }
        }
    }

    if (categoryTotals[Sasp_Categories.LAAS]) {
        if (laasReallocationNeeded == 0 && potLaasReallocation > 0 && totalNonSaas <= totalReallocationNeeded && potLaasReallocation > (totalReallocationNeeded - totalNonSaas)) {
            laasReallocation = -1 * (saasReallocation + hsaasReallocation + xtReallocation);
            categoryTotals[Sasp_Categories.LAAS]["reallocation"] = laasReallocation;
        }
    }

    return overage;
}

function determineSaspStatus(overage, categoryTotals, Sasp_Categories) {
    let saspStatus;

    if (overage > 0 && Object.keys(categoryTotals).length === 1) {
        saspStatus = "Single PoB SASP violation";
    } else if (
        overage > 0 &&
        !categoryTotals[Sasp_Categories.HSAAS] &&
        !categoryTotals[Sasp_Categories.XT]
    ) {
        saspStatus = "Multi PoB SASP violations";
    } else {
        let discountsEqualized = true;
        if (
            categoryTotals[Sasp_Categories.HSAAS] &&
            categoryTotals[Sasp_Categories.XT] &&
            Math.round(categoryTotals[Sasp_Categories.HSAAS]["discountPct"] * 100) !==
            Math.round(categoryTotals[Sasp_Categories.XT]["discountPct"] * 100)
        ) {
            discountsEqualized = false;
        }

        if (discountsEqualized) {
            saspStatus = "Multi PoB SASP violations, potential SASP reallocation";
        } else {
            if (overage === 0) {
                saspStatus = "Potential discount equalization";
            } else if (
                (categoryTotals[Sasp_Categories.SAAS] &&
                    categoryTotals[Sasp_Categories.SAAS]["potReallocation"] == overage) ||
                (categoryTotals[Sasp_Categories.LAAS] &&
                    categoryTotals[Sasp_Categories.LAAS]["potReallocation"] == overage)
            ) {
                saspStatus = "Single PoB SASP violation, potential discount equalization";
            } else {
                saspStatus = "Multi PoB SASP violations, potential SASP reallocation, potential discount equalization";
            }
        }
    }

    return saspStatus;
}

function populateSaspTotalsOnQuote(quote, saspStatus, categoryTotals) {
    const categoryToField = {
        total: {
            SaaS: "SaaS_Total__c",
            LaaS: "LaaS_Total__c",
            HSaaS: "HSaaS_Total__c",
            XT: "XT_Total__c"
        },
        netTotal: {
            SaaS: "SaaS_Net_Total__c",
            LaaS: "LaaS_Net_Total__c",
            HSaaS: "HSaaS_Net_Total__c",
            XT: "XT_Net_Total__c",
            //CR-034653
            ExtendedPerpetual: "Extended_Perpetual_Net_Total__c",
            Maintenance: "Maintenance_net_total__c",
            OnPremSub: "On_Prem_Subscription_Net_Total__c"
        },
        discountPct: {
            SaaS: "SaaS_Discount__c",
            LaaS: "LaaS_Discount__c",
            HSaaS: "HSaaS_Discount__c",
            XT: "XT_Discount__c"
        },
        potReallocation: {
            SaaS: "SaaS_Potential_Reallocation__c",
            LaaS: "LaaS_Potential_Reallocation__c",
            HSaaS: "HSaaS_Potential_Reallocation__c",
            XT: "XT_Potential_Reallocation__c"
        },
        reallocation: {
            SaaS: "Saas_Reallocation_Amount__c",
            LaaS: "Laas_Reallocation_Amount__c",
            HSaaS: "HSaas_Reallocation_Amount__c",
            XT: "XT_Reallocation_Amount__c"
        },
        postReallocation: {
            SaaS: "SaaS_Post_Reallocation__c",
            LaaS: "LaaS_Post_Reallocation__c",
            HSaaS: "HSaaS_Post_Reallocation__c",
            XT: "XT_Post_Reallocation__c"
        },
        term: {
            SaaS: "SaaS_Term__c",
            LaaS: "LaaS_Term__c",
            HSaaS: "HSaaS_Term__c",
            XT: "XT_Term__c"
        }
    };

    for (const fieldType in categoryToField) {
        for (const key in categoryToField[fieldType]) {
            let fieldName = categoryToField[fieldType][key];
            quote.record[fieldName] = 0.0;
        }
    }

    for (const fieldType in categoryToField) {
        for (const key in categoryTotals) {
            if (fieldType === "postReallocation") {
                quote.record[categoryToField[fieldType][key]] =
                    categoryTotals[key]["netTotal"] + categoryTotals[key]["reallocation"];
            } else if (fieldType === "discountPct") {
                quote.record[categoryToField[fieldType][key]] = categoryTotals[key][fieldType] * 100;
            } else {
                quote.record[categoryToField[fieldType][key]] = categoryTotals[key][fieldType];
            }
        }
    }

    quote.record["SASP_Type__c"] = saspStatus;
}

function calculateSasp(quote, quoteLines) {
    const Sasp_Categories = {
        SAAS: "SaaS",
        HSAAS: "HSaaS",
        LAAS: "LaaS",
        XT: "XT",
        //CR-034653
        ExtendedPerpetual: "ExtendedPerpetual",
        Maintenance: "Maintenance",
        OnPremSub: "OnPremSub"
    };

    const saspCategoriesMap = {
        "HSaaS Addon": [Sasp_Categories.HSAAS],
        "HSaaS Base": [Sasp_Categories.HSAAS],
        "LaaS": [Sasp_Categories.LAAS],
        "SaaS - Cflag": [Sasp_Categories.SAAS],
        "SaaS - Eflag": [Sasp_Categories.XT],
        "SaaS - No Flag": [Sasp_Categories.SAAS],
        "SaaS - Xflag": [Sasp_Categories.SAAS],
        "SaaS - Dflag": [Sasp_Categories.SAAS],
        "SaaS - Zflag": [Sasp_Categories.HSAAS],
        "SaaS - Tflag": [Sasp_Categories.HSAAS], //CR-034365
        "Consulting": null,
        "Service Fee": null
    };

    let categoryTotals = {};

    //CR-022019
    const excluded_ProductCodeSet = new Set(["SAASOPS7000", "SAASOPS7001"]);

    quoteLines.forEach((ql) => {
        let saspCategory;
        const licenseType = ql.record["CPQ_License_Type__c"]; //CR-034653

        if (["EXTEND", "TEST", "BKUP", "N/A"].includes(licenseType)) {
            saspCategory = "ExtendedPerpetual";
        } else if (["MAINT", "TESTM", "BKUPM"].includes(licenseType)) {
            saspCategory = "Maintenance";
        } else if (ql.record["Product_Flag__c"]) {
            if (ql.record["Product_Flag__c"] === 'On Premise' && ["S TEST", "S BKUP", "FSUB"].includes(licenseType)) {
                saspCategory = "OnPremSub";
            } else {
                saspCategory = saspCategoriesMap[ql.record["Product_Flag__c"]];
            }
        } else {
            saspCategory = Sasp_Categories.SAAS;
        }

        if (saspCategory && !excluded_ProductCodeSet.has(ql.record["SBQQ__ProductCode__c"])) {
            if (!(saspCategory in categoryTotals)) {
                categoryTotals[saspCategory] = {
                    total: 0,
                    netTotal: 0,
                    discount: 0,
                    discountPct: 0,
                    potReallocation: 0,
                    reallocation: 0,
                    allocationPct: 0,
                    term: ql.record["True_Effective_Term__c"]
                };
            }

            if (categoryTotals[saspCategory]["term"] !== "*" && categoryTotals[saspCategory]["term"] !== ql.record["True_Effective_Term__c"]) {
                categoryTotals[saspCategory]["term"] = "*";
            }

            categoryTotals[saspCategory]["total"] += ql.RegularTotal__c;
            categoryTotals[saspCategory]["discount"] += ql.RegularTotal__c - ql.CustomerTotal__c;
            categoryTotals[saspCategory]["netTotal"] += ql.NetTotal__c;
        }
    });

    let hsaasXtTotal =
        (categoryTotals[Sasp_Categories.HSAAS] ? categoryTotals[Sasp_Categories.HSAAS]["total"] : 0) +
        (categoryTotals[Sasp_Categories.XT] ? categoryTotals[Sasp_Categories.XT]["total"] : 0);

    for (const key in categoryTotals) {
        let currCategory = categoryTotals[key];
        currCategory["discountPct"] = currCategory["total"] > 0 ? currCategory["discount"] / currCategory["total"] : 0;

        if (key === Sasp_Categories.HSAAS || key === Sasp_Categories.XT) {
            currCategory["allocationPct"] = currCategory["total"] / hsaasXtTotal;
        }
    }

    let saspStatus = "";
    let overage = calculateSaspOverage(categoryTotals, Sasp_Categories);

    if (
        overage > 0 ||
        (categoryTotals[Sasp_Categories.HSAAS] &&
            categoryTotals[Sasp_Categories.XT] &&
            Math.round(categoryTotals[Sasp_Categories.HSAAS].discountPct * 100) !==
            Math.round(categoryTotals[Sasp_Categories.XT].discountPct * 100))
    ) {
        saspStatus = determineSaspStatus(overage, categoryTotals, Sasp_Categories);
    }

    populateSaspTotalsOnQuote(quote, saspStatus, categoryTotals);
}

function adjustComponeenttotal(adjustment, listTotal, requiredByQuoteline, quoteLines) {
    quoteLines.forEach((quoteLine) => {
        if (quoteLine.record["Id"] == requiredByQuoteline) {
            quoteLine.record["SBQQ__ComponentTotal__c"] -= adjustment;
            quoteLine.record["SBQQ__ComponentTotal__c"] += listTotal;
            quoteLine.record["SBQQ__ComponentListTotal__c"] = quoteLine.record["SBQQ__ComponentTotal__c"];
        }
    });
}

function calculateBundleTotal(quote, quoteLines) {
    quoteLines.forEach((quoteLine) => {
        let adjustment = 0;
        let listTotal = 0;
        let requiredByQuoteline;

        if (quoteLine.record["SBQQ__ProductCode__c"] == 'SAASOPS7000' && quoteLine.record["SBQQ__RequiredBy__c"] != null) {
            listTotal = (quoteLine.record["SBQQ__ListPrice__c"]);
            adjustment = quoteLine.record["SBQQ__NetTotal__c"];
            requiredByQuoteline = quoteLine.record["SBQQ__RequiredBy__c"];
            adjustComponeenttotal(adjustment, listTotal, requiredByQuoteline, quoteLines);
        }
    });
}

export function afterCalculate(quoteModel, quoteLineModels) {
    return new Promise((resolve, reject) => {
        let start = Date.now();

        var maxEffectiveEndDate = null;
        var maxEffectiveTerm = 0;
        //CR-027296
        var minEffectiveStartDate = null;
        /* CR-032601 */
        let maxLineEndDate = null;
        let maxLineEndDateAll = null;

        let platforms = new Set();
        let installs = new Set();
        let tcs = new Set();
        let legalAttributes = new Set();
        let sapServerIdValues = new Set();
        let firstSupportLevel = null;
        let hasMismatch = false;
        let hasMismatchProductSupportLevel = false;

        // CR-035269
        const maintLicenseTypes = new Set(['MAINT', 'TESTM', 'BKUPM']);
        const extendLicenseTypes = new Set(['EXTEND', 'TEST', 'BKUP']);
        let extendLines = new Set();
        let sourceToClonedMap = new Map();

        /* CR-032601 */
        let quoteExpirationDate = null;
        let expEndOfMonthStr = null;
        let expNextMonthStart = null;
        let expNextMonthStartStr = null;
        const isMaintRenewal = quoteModel.record["Sub_Type__c"] === 'Maintenance Renewal';

        if (isMaintRenewal) {
            const quoteExpirationDateStr = quoteModel.record["Expiration_Date__c"];
            if (quoteExpirationDateStr) {
                const expParts = quoteExpirationDateStr.split('-');
                quoteExpirationDate = new Date(Date.UTC(expParts[0], expParts[1] - 1, expParts[2]));

                const expEndOfMonth = new Date(Date.UTC(quoteExpirationDate.getUTCFullYear(), quoteExpirationDate.getUTCMonth() + 1, 0));
                expEndOfMonthStr = expEndOfMonth.getUTCFullYear() + '-' +
                    String(expEndOfMonth.getUTCMonth() + 1).padStart(2, '0') + '-' +
                    String(expEndOfMonth.getUTCDate()).padStart(2, '0');

                expNextMonthStart = new Date(Date.UTC(quoteExpirationDate.getUTCFullYear(), quoteExpirationDate.getUTCMonth() + 1, 1));
                expNextMonthStartStr = expNextMonthStart.getUTCFullYear() + '-' +
                    String(expNextMonthStart.getUTCMonth() + 1).padStart(2, '0') + '-' +
                    String(expNextMonthStart.getUTCDate()).padStart(2, '0');
            }
        }

        if (quoteLineModels != null) {
            quoteLineModels.forEach(function (line) {
                if ((line.record["Product_Flag__c"] === "On Premise" || line.record["Product_Flag__c"] === "HSaaS Base" ||
                    line.record["Product_Flag__c"] === "HSaaS Addon") && line.record["CPQ_License_Type__c"] === "FSUB") {
                    line.record["Entitlement__c"] = null;
                    line.record["Entitlement_Logic__c"] = null;
                    line.record["Entitlement_on_Document__c"] = null;
                }//CR-36094

                if (line.record["AdditionalDiscountRate__c"] != '0' &&
                    line.record["AdditionalDiscountRate__c"] != null &&
                    quoteModel.record["SBQQ__Status__c"] == 'Draft' &&
                    line.record["Price_Segment__c"] != '1P101' &&
                    line.record["Division__c"] == '01') {
                    line.record["SBQQ__Discount__c"] = line.record["AdditionalDiscountRate__c"];
                }

                // CR-14901
                if (line.record["SAP_Platform__c"]) {
                    platforms.add(line.record["SAP_Platform__c"]);
                }
                if (line.record["Install__c"]) {
                    installs.add(line.record["Install__c"]);
                }
                if (line.record["Product_Specific_Terms__c"]) {
                    tcs.add(line.record["Product_Specific_Terms__c"]);
                }

                // CR-15602, CR-021898
                if (line.record["Product_Legal_Attribute__c"] && line.record["SBQQ__EffectiveQuantity__c"] > 0 && quoteModel.record["SBQQ__Type__c"] === 'Amendment') {
                    line.record["Product_Legal_Attribute__c"].split(";").forEach(attr => {
                        if (attr && attr.trim()) legalAttributes.add(attr);
                    });
                } else if (line.record["Product_Legal_Attribute__c"] && quoteModel.record["SBQQ__Type__c"] !== 'Amendment') {
                    line.record["Product_Legal_Attribute__c"].split(";").forEach(attr => {
                        if (attr && attr.trim()) legalAttributes.add(attr);
                    });
                }

                // CR-17092
                if (line.record['Special_License_Type_Indicator__c']) {
                    line.record['Special_License_Type_Indicator__c'].split(';').forEach(attr => {
                        if (attr && attr.trim()) legalAttributes.add(attr);
                    });
                }

                // CPM decimal calculation
                if (line.record["SBQQ__ChargeType__c"] == 'Usage') {
                    if (line.record["Cost_Model__c"] == 'CPM') {
                        line.record["SBQQ__ProratedListPrice__c"] = line.record["SBQQ__ListPrice__c"];
                        line.record["SBQQ__ProratedPrice__c"] = line.record["SBQQ__ListPrice__c"];
                        line.record["SBQQ__RegularPrice__c"] = line.record["SBQQ__ListPrice__c"];
                        line.record["SBQQ__SpecialPrice__c"] = line.record["SBQQ__ListPrice__c"];
                        line.record["SBQQ__PartnerPrice__c"] = line.record["SBQQ__ListPrice__c"];
                        if (line.record["SBQQ__Discount__c"] != null) {
                            line.record["SBQQ__CustomerPrice__c"] = line.record["SBQQ__ListPrice__c"] * (1 - line.record["SBQQ__Discount__c"] / 100);
                        } else if (line.record["SBQQ__AdditionalDiscountAmount__c"] != null) {
                            line.record["SBQQ__CustomerPrice__c"] = (line.record["SBQQ__ListPrice__c"].toFixed(2) - line.record["SBQQ__AdditionalDiscountAmount__c"]);
                        } else {
                            line.record["SBQQ__CustomerPrice__c"] = line.record["SBQQ__ListPrice__c"];
                        }
                        line.record["SBQQ__NetPrice__c"] = line.record["SBQQ__CustomerPrice__c"];
                    }
                }

                var startDate =
                    line.effectiveStartDate != null
                        ? line.effectiveStartDate
                        : line.record["SBQQ__EffectiveStartDate__c"];

                // CR 027697
                let quoteEndDate = quoteModel.record["SBQQ__EndDate__c"] ? new Date(quoteModel.record["SBQQ__EndDate__c"]) : null;

                var endDate = line.effectiveEndDate != null ? line.effectiveEndDate : line.record["SBQQ__EffectiveEndDate__c"];
                var trueTerm = getEffectiveSubscriptionTerm(quoteModel, line);
                var trueEndDate = calculateEndDate(startDate, endDate, trueTerm);

                // CR 027697
                if (quoteEndDate && trueEndDate > quoteEndDate) {
                    trueEndDate = quoteEndDate;
                }

                if (maxEffectiveEndDate == null || maxEffectiveEndDate < trueEndDate) {
                    maxEffectiveEndDate = trueEndDate;
                }
                if (maxEffectiveTerm < trueTerm) {
                    maxEffectiveTerm = trueTerm;
                }

                //CR-027296
                if (minEffectiveStartDate == null || minEffectiveStartDate > startDate) {
                    minEffectiveStartDate = startDate;
                }

                //CR:022457, CR:028165
                if ((line.record["Start_Date_Type__c"] == 'Fixed Start Date')) {
                    line.record["True_Effective_End_Date__c"] = toApexDate(trueEndDate);
                }
                line.record["True_Effective_Term__c"] = trueTerm;

                /* CR-032601 */
                const lineEndDateStr = line.record["SBQQ__EndDate__c"];
                let lineEndDate = null;
                if (isMaintRenewal && lineEndDateStr) {
                    const lineEndParts = lineEndDateStr.split('-');
                    lineEndDate = new Date(Date.UTC(lineEndParts[0], lineEndParts[1] - 1, lineEndParts[2]));
                    if (maxLineEndDateAll == null || maxLineEndDateAll < lineEndDate) {
                        maxLineEndDateAll = lineEndDate;
                    }
                }

                if (isMaintRenewal && quoteExpirationDate && expEndOfMonthStr) {
                    const lineStartDateStr = line.record["SBQQ__StartDate__c"];

                    if (lineStartDateStr && lineEndDateStr) {
                        const startParts = lineStartDateStr.split('-');
                        const lineStartDate = new Date(Date.UTC(startParts[0], startParts[1] - 1, startParts[2]));

                        if (lineStartDate < quoteExpirationDate && lineEndDate < quoteExpirationDate) {
                            line.record["Backward_Start_Date__c"] = lineStartDateStr;
                            line.record["Backward_End_Date__c"] = expEndOfMonthStr;
                            line.record["Forward_Start_Date__c"] = expNextMonthStartStr;
                            if (lineEndDate != null && expNextMonthStart != null && lineEndDate < expNextMonthStart) {
                                const forwardEndFromStart = new Date(Date.UTC(
                                    expNextMonthStart.getUTCFullYear(),
                                    expNextMonthStart.getUTCMonth() + 12,
                                    expNextMonthStart.getUTCDate() - 1
                                ));
                                line.record["Forward_End_Date__c"] = forwardEndFromStart.getUTCFullYear() + '-' +
                                    String(forwardEndFromStart.getUTCMonth() + 1).padStart(2, '0') + '-' +
                                    String(forwardEndFromStart.getUTCDate()).padStart(2, '0');
                                line.record["SBQQ__EndDate__c"] = line.record["Forward_End_Date__c"];
                                if (maxLineEndDate == null || maxLineEndDate < forwardEndFromStart) {
                                    maxLineEndDate = forwardEndFromStart;
                                }
                            } else {
                                line.record["Forward_End_Date__c"] = lineEndDateStr;
                            }
                        }
                        else if (lineStartDate >= quoteExpirationDate && lineEndDate >= quoteExpirationDate) {
                            line.record["Backward_Start_Date__c"] = null;
                            line.record["Backward_End_Date__c"] = null;
                            line.record["Forward_Start_Date__c"] = lineStartDateStr;
                            line.record["Forward_End_Date__c"] = lineEndDateStr;
                        }
                        else {
                            line.record["Backward_Start_Date__c"] = lineStartDateStr;
                            line.record["Backward_End_Date__c"] = expEndOfMonthStr;
                            line.record["Forward_Start_Date__c"] = expNextMonthStartStr;
                            line.record["Forward_End_Date__c"] = lineEndDateStr;
                        }
                    }
                }

                // CR-035269
                if (quoteModel.record["Sub_Type__c"] != "Maintenance Renewal" && line.record.PRMES_Product_Type__c === 'LM' && line.record.CPQ_License_Type__c && extendLicenseTypes.has(line.record.CPQ_License_Type__c.toUpperCase())) {
                    line.record.SBQQ__SubscriptionTerm__c = 1;
                    if (line.record.Id) {
                        extendLines.add(line.record.Id);
                    }
                }
                if (quoteModel.record["Sub_Type__c"] != "Maintenance Renewal" && line.record.SBQQ__Source__c && line.record.PRMES_Product_Type__c === 'LM' && line.record.CPQ_License_Type__c && maintLicenseTypes.has(line.record.CPQ_License_Type__c.toUpperCase())) {
                    if (!sourceToClonedMap.has(line.record.SBQQ__Source__c)) {
                        sourceToClonedMap.set(line.record.SBQQ__Source__c, new Set());
                    }
                    sourceToClonedMap.get(line.record.SBQQ__Source__c).add(line);
                }
            });

            quoteModel.record["True_Effective_End_Date__c"] = toApexDate(maxEffectiveEndDate);
            quoteModel.record["True_Effective_Term__c"] = maxEffectiveTerm;

            //CR-038047
            if (isMaintRenewal && maxLineEndDate != null) {
                quoteModel.record["SBQQ__EndDate__c"] = toApexDate(maxLineEndDate);
            }
            if (isMaintRenewal && !quoteModel.record["SBQQ__EndDate__c"] && maxLineEndDateAll != null) {
                quoteModel.record["SBQQ__EndDate__c"] = toApexDate(maxLineEndDateAll);
            }
        }

        // CR-14901
        quoteModel.record["Number_Platforms__c"] = platforms.size;
        quoteModel.record["Number_Installs__c"] = installs.size;
        quoteModel.record["Number_TCs__c"] = tcs.size;

        //CR-16244
        quoteModel.record["Unique_Product_Terms__c"] = [...tcs].join(',');

        // CR-15602
        quoteModel.record['Unique_Supplemental_Terms_Codes__c'] = [...legalAttributes].join(',');

        //CR-027296
        quoteModel.record["Latest_End_Date__c"] = toApexDate(maxEffectiveEndDate);
        if (maxEffectiveEndDate != null && minEffectiveStartDate != null) {
            var eDate = new Date(quoteModel.record["Latest_End_Date__c"]);
            eDate.setUTCDate(eDate.getUTCDate() + 1);
            quoteModel.record["Total_Subscription_Term__c"] = monthsBetween(minEffectiveStartDate, eDate);
        } else {
            quoteModel.record["Total_Subscription_Term__c"] = null;
        }

        stampOriginalGroupId(quoteModel, quoteLineModels);
        calculateAcv(quoteModel, quoteLineModels);
        calculateSasp(quoteModel, quoteLineModels);
        calculateBundleTotal(quoteModel, quoteLineModels);

        let end = Date.now();

        // CR-035269
        if (quoteModel.record["Sub_Type__c"] != "Maintenance Renewal") {
            // CR-034854
            const existingQuoteLineSourceByLineId = quoteModel.__existingQuoteLineSourceByLineId || {};
            validateMaintLinesForPerpetual(quoteLineModels, sourceToClonedMap, extendLines, maintLicenseTypes, extendLicenseTypes, existingQuoteLineSourceByLineId);
        }

        if (quoteModel.__liErrorMessage) {
            quoteLineModels.forEach(line => {
                line.record["Error_Alert__c"] = (line.record["Error_Alert__c"] || '') + ' ' + quoteModel.__liErrorMessage;
            });
        }

        //CR:035804
        const quoteLines = quoteLineModels;
        const childLinesByParent = {};

        for (let line of quoteLines) {
            const parentId = line.record["SBQQ__RequiredBy__c"];
            if (parentId) {
                if (!childLinesByParent[parentId]) {
                    childLinesByParent[parentId] = [];
                }
                childLinesByParent[parentId].push(line);
            }
        }

        for (let parent of quoteLines) {
            const parentId = parent.record["Id"];
            const childQuoteLines = childLinesByParent[parentId];

            if (!childQuoteLines || childQuoteLines.length === 0) continue;

            let total = 0;
            for (let child of childQuoteLines) {
                total += (child.record["SBQQ__AdditionalDiscount__c"] || 0);
            }

            parent.record["Total_Bundle_Discount__c"] = total;
        }

        //CR-021802
        if (quoteModel.record["SBQQ__Type__c"] == 'Quote' && quoteModel.record["ERP_Type__c"] != "Sherpa X") quoteModel.record["Start_Date_Type__c"] = '';

        resolve();
    });
}
