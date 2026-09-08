'use strict'

function containsSalesOrg(promoSales, sales) {
    if (promoSales != null && sales != null) {
        let salesOrgs = promoSales.split(';');
        return salesOrgs.includes(sales.trim());
    }
    return false;
}

function validateQuoteLinePromo(quoteLineModels, issueLineObj) {
    let qlValidate = true;

    for (let item of quoteLineModels) {
        if (item.record["Promo_Code__c"]) {
            if (item.record["Promo_Code_Start_Date__c"]
                && item.record["Promo_Code_End_Date__c"]
                && item.record["Promo_Code_Sales_Org__c"]
                && item.record["SBQQ__EffectiveStartDate__c"]
                && item.record["Sales_Org__c"]) {

                if ((item.record["SBQQ__EffectiveStartDate__c"] < item.record["Promo_Code_Start_Date__c"])
                    || (item.record["SBQQ__EffectiveStartDate__c"] > item.record["Promo_Code_End_Date__c"])
                    || !containsSalesOrg(item.record["Promo_Code_Sales_Org__c"], item.record["Sales_Org__c"])) {

                    //qlValidate = false;
                    issueLineObj.lineName = item.record["SBQQ__Number__c"];
                    issueLineObj.productName = item.record["SBQQ__ProductName__c"];
                    return false;
                }
            }
        }
    }

    return qlValidate;
}

export function afterPriceRules(quoteModel, quoteLineModels) {
    return new Promise((resolve, reject) => {
        let installSupportMap = new Map(); // CR-022892
        let installIdsSupportMismatch = new Set(); // CR-022892

        quoteLineModels.forEach(line => {
            if (
                line.record.Install__c &&
                line.record.Install__r &&
                line.record.Install__r.Name &&
                line.record.Support_Level__c &&
                line.record.Product_Support_Level__c &&
                line.record.Product_Support_Level__c !== 'N/A'
            ) {
                let installId = line.record.Install__c;

                if (!installSupportMap.has(installId)) {
                    installSupportMap.set(installId, new Set());
                    installSupportMap.get(installId).add(line.record.Support_Level__c.trim());
                } else {
                    if (!installSupportMap.get(installId).has(line.record.Support_Level__c.trim())) {
                        installIdsSupportMismatch.add(installId);
                    }
                }
            }
        });

        // CR-022892
        quoteLineModels.forEach(function (line) {
            let supportLevel = line.record["Support_Level__c"];
            let productSupportLevel = line.record["Product_Support_Level__c"];
            let hasMismatch = false;

            // CR-033981
            if (productSupportLevel && productSupportLevel !== 'N/A') {
                const supportLevels = productSupportLevel
                    .split(';')
                    .map(v => v.trim())
                    .filter(Boolean);

                if (!supportLevel || !supportLevels.includes(supportLevel.trim())) {
                    hasMismatch = true;
                }
            }

            if (line.record["Install__c"] || line.record["Entitlement_Group__c"]) {
                //CR:030493, CR-030543, CR-022892
                if (((line.record["Install__c"] && line.record["Install__r"] && line.record["Install__r"].Name !== null && line.record["Install__r"].Name != undefined)
                    || (line.record["Entitlement_Group__c"] && line.record["Entitlement_Group__r"].Name != undefined
                        && line.record["Entitlement_Group__r"].Name.includes('New EG')))
                    && hasMismatch
                    && quoteModel.record["Indirect_Direct_Opp__c"] === 'DIRECT') {
                    line.record["New_Install_Validation__c"] = true;
                } else {
                    line.record["New_Install_Validation__c"] = false;
                }

                if (((line.record["Install__c"] && line.record["Install__r"] && line.record["Install__r"].Name != undefined && installIdsSupportMismatch.has(line.record["Install__c"])))
                    && quoteModel.record["Indirect_Direct_Opp__c"] === 'DIRECT') {
                    line.record["Existing_New_Install_Validation__c"] = true;
                } else {
                    line.record["Existing_New_Install_Validation__c"] = false;
                }
            }
        });

        // US-013740
        let quotelineObj = {
            lineName: '',
            productName: ''
        };
        if (!validateQuoteLinePromo(quoteLineModels, quotelineObj)) {
            throw Error('Invalid Promo Code Applied to Quote Line #' + quotelineObj.lineName + ' for Product ' + quotelineObj.productName);
        }
        resolve('Success!');
    });
}
