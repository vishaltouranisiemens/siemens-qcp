'use strict'

export function init(quoteLineModels) {
    return new Promise((resolve, reject) => {
        //CR026688
        for (var i = 0; i < quoteLineModels.length; i++) {
            if (quoteLineModels[i].record["SBQQ__ChargeType__c"] == "Usage") {
                quoteLineModels[i].calculateFullTermPrice = true;
            }
        }
        resolve();
    });
}
