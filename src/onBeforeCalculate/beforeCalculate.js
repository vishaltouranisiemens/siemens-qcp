'use strict'

import { calculateEndDate, getEffectiveSubscriptionTerm, toApexDate, monthsBetween } from '../util/helperFunctions'

async function apexCallout(payload, conn) {
    const payloadJson = JSON.stringify(payload);
    let result;

    await conn.apex
        .post("/qcp-helper/", {
            qcpRequest: payloadJson
        })
        .then((results) => {
            result = JSON.parse(results);
        });

    return result;
}

function populateRampGroupValues(quote) {
    const DEFAULT_TERM = 12;
    if (quote.groups.length > 0 && quote.record["SBQQ__LineItemsGrouped__c"]) {
        let rampGroupNamePrefix = "Ramp Sub-Term";
        let rampGroups = [];

        let rampId = 1000;
        let rampIdMap = {};

        let counter = 1;
        quote.groups.forEach((group) => {
            //025463
            if (group.record["Ramp_Group__c"] || group.record["Group_Type__c"] == 'Stage Delivery') {
                rampGroups.push(group);
            } else {
                if (group.record["Name"].includes(rampGroupNamePrefix)) {
                    group.record["Name"] = `Group${counter}`;
                    group.record["SBQQ__StartDate__c"] = quote.record["SBQQ__StartDate__c"];
                    group.record["SBQQ__SubscriptionTerm__c"] = null;
                    group.record["Ramp_Percentage_of_Revenue__c"] = null;

                    group.lineItems.forEach((line) => {
                        line.record["Ramp_Key__c"] = null;
                        line.record["Ramp_Id__c"] = null;
                        line.record["Ramp_Average_Price__c"] = null;
                    });
                } else if (group.record["Group_Name_Change__c"]) {
                    //CR-029181
                    group.record["Name"] = "Group" + counter;
                    group.record["Group_Name_Change__c"] = false;
                }
            }

            group.record["Partner_Account__c"] = quote.record["SBQQ__Partner__c"];
            group.record["Sales_Org__c"] = quote.record["Sales_Org__c"];
            counter++;
        });

        let startDate = quote.record["SBQQ__StartDate__c"];

        counter = 1;
        rampGroups.forEach((group) => {
            group.record["SBQQ__StartDate__c"] = startDate;
            //CR-029181
            if (group.record["Name"] == 'Group' + ("" + counter)) group.record["Name"] = rampGroupNamePrefix + (" " + counter);
            group.record["Group_Name_Change__c"] = true;
            let endDate = group.record["SBQQ__EndDate__c"];

            group.lineItems.forEach((line) => {
                line.record["Ramp_Key__c"] = `${line.record["SBQQ__Quote__c"]}:${line.record["Install__c"]}:${line.record["SBQQ__ProductCode__c"]}`;

                if (line.record["Ramp_Key__c"] in rampIdMap) {
                    line.record["Ramp_Id__c"] = rampIdMap[line.record["Ramp_Key__c"]];
                } else {
                    line.record["Ramp_Id__c"] = rampId;
                    rampIdMap[line.record["Ramp_Key__c"]] = rampId;
                    rampId++;
                }

                //CR-037169-Venkat- Skip this logic for Sherpa X Amendment Stage Delivery
                if (
                    quote.record["SBQQ__Type__c"] === "Amendment" &&
                    quote.record["ERP_Type__c"] === "Sherpa X" &&
                    group.record["Group_Type__c"] === "Stage Delivery"
                ) {
                    // skip non-renewable logic
                } else {
                    if (counter < rampGroups.length) {
                        line.record["Non_Renewable__c"] = true;
                    } else {
                        line.record["Non_Renewable__c"] = false;
                    }
                }
            });

            if (!group.SubscriptionTerm__c) {
                group.SubscriptionTerm__c = DEFAULT_TERM;
                group.record["SBQQ__SubscriptionTerm__c"] = DEFAULT_TERM;
            }

            var trueEndDate = calculateEndDate(startDate, endDate, group.SubscriptionTerm__c);

            if (counter === rampGroups.length) {
                let numMonths = monthsBetween(
                    new Date(quote.record["SBQQ__StartDate__c"]),
                    trueEndDate
                );

                if (numMonths > quote.record["SBQQ__SubscriptionTerm__c"]) {
                    quote.record["Invalid_Ramp__c"] = true;
                } else {
                    quote.record["Invalid_Ramp__c"] = false;
                }
            }

            trueEndDate.setUTCDate(trueEndDate.getUTCDate() + 1);
            startDate = toApexDate(trueEndDate);
            counter++;
        });

        // CR-037169-update-non-renewal-for amendment-staged delivery
        if (
            quote.record["SBQQ__Type__c"] === "Amendment" &&
            quote.record["ERP_Type__c"] === "Sherpa X"
        ) {
            quote.groups.forEach((group) => {
                if (rampGroups.includes(group)) {
                    return;
                }

                if (
                    quote.record["SBQQ__EndDate__c"] &&
                    group.record["SBQQ__EndDate__c"]
                ) {
                    let quoteEndParts = quote.record["SBQQ__EndDate__c"].split('-');
                    let quoteFinalEndDate = new Date(quoteEndParts[0], quoteEndParts[1] - 1, quoteEndParts[2]);

                    let groupEndParts = group.record["SBQQ__EndDate__c"].split('-');
                    let groupEndDate = new Date(groupEndParts[0], groupEndParts[1] - 1, groupEndParts[2]);

                    let matchesFinalEndDate =
                        quoteFinalEndDate.getFullYear() === groupEndDate.getFullYear() &&
                        quoteFinalEndDate.getMonth() === groupEndDate.getMonth() &&
                        quoteFinalEndDate.getDate() === groupEndDate.getDate();

                    group.lineItems.forEach((line) => {
                        if (matchesFinalEndDate) {
                            line.record["Non_Renewable__c"] = false;
                        } else {
                            line.record["Non_Renewable__c"] = true;
                        }
                    });
                }
            });
        }
    }
}

export async function beforeCalculate(quoteModel, quoteLineModels, conn) {

    //CR-030777
    if (quoteModel.record["SBQQ__Status__c"] == "Denied" || quoteModel.record["SBQQ__Status__c"] == "Expired") {
        throw Error('Modifications should be done on Draft status quotes only.');
    }

    const PROD_FLAG_ADDON = "HSaaS Addon";

    //CR-026381
    const targetAmount = quoteModel.record["SBQQ__TargetCustomerAmount__c"];
    let hasSaasopsProduct = false;
    if (targetAmount != undefined && targetAmount != null) {
        for (let line of quoteLineModels) {
            const productCode = line.record["SBQQ__ProductCode__c"];
            const effectiveQuantity = line.record["SBQQ__EffectiveQuantity__c"];
            if ((productCode == "SAASOPS7000" || productCode == "SAASOPS7001") && effectiveQuantity != 0) {
                hasSaasopsProduct = true;
                break;
            }
        }
    }

    if (hasSaasopsProduct) {
        throw Error('Target Customer Amount is not supported with SAASOPS products, remove the Target Customer Amount and proceed.');
    }

    // CR-15228
    const IGNORE_CLONING_FIELDS = ["Error_Alert__c", "Missing_Base__c", "License_Contact__c", "Missing_PreReq__c", "Ramp_Key__c", "Ramp_Id__c", "Ramp_Average_Price__c",
        "Current_ACV_12_Mth__c",
        "Original_Group_Id__c", "Previous_Quantity__c", "Previous_Access_Range__c", "Previous_License_Type__c", "Install__c"];
    let start = Date.now();

    if (quoteModel.groups.length > 0) {
        populateRampGroupValues(quoteModel);
    }

    let quoteLines = [];
    let quoteLineMap = {};
    let groupMap = {};
    const byKey = new Map(); // CR:031935

    // CR-15984
    for (let group of quoteModel.groups) {
        groupMap[group.key] = group;
    }

    // CR-16575
    let restrictedMap = {};

    //CR-021801
    if (quoteModel.record["Start_Date_Type__c"] == "Flexible Start Date" && quoteModel.record["SBQQ__Type__c"] == "Renewal") { throw Error('Renewal quotes cannot have Flexible Start Date Type.'); }

    //CR-021802
    if (quoteModel.record["Start_Date_Type__c"] == "Flexible Start Date" && quoteModel.record["SBQQ__Type__c"] == "Amendment") { throw Error('Amendment quotes cannot have Flexible Start Date Type.'); }

    //CR-021800
    if (quoteModel.record["Start_Date_Type__c"] == "Flexible Start Date" && quoteModel.record["SBQQ__EndDate__c"] != null) { throw Error('End Date needs to be blank for Flexible Start Date type Quotes'); }

    //CR-032650
    if (quoteModel.record["SBQQ__EndDate__c"] != null || quoteModel.record["SBQQ__EndDate__c"] != undefined) {
        var originalDate = quoteModel.record["SBQQ__EndDate__c"];
        const parts = originalDate.split('-');
        var existingEndDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
        var curntDate = existingEndDate.getUTCDate().toString().padStart(2, '0');

        const lastDay = new Date(Date.UTC(existingEndDate.getUTCFullYear(), existingEndDate.getUTCMonth() + 1, 0));
        lastDay.setUTCDate(lastDay.getUTCDate());
        const lastDayOfMonth = lastDay.getUTCDate().toString().padStart(2, '0');

        if (quoteModel.record["Sub_Type__c"] == 'Maintenance Renewal' && curntDate >= 1 && curntDate < lastDayOfMonth) {
            quoteModel.record["SBQQ__EndDate__c"] = existingEndDate.getUTCFullYear() + '-' + (existingEndDate.getUTCMonth() + 1).toString().padStart(2, '0') + '-' + lastDayOfMonth;
        }
    }

    //CR:023783
    var currentDate = new Date();
    currentDate.setDate(currentDate.getDate());
    var todayDateFormat = currentDate.getFullYear() + '-' + (currentDate.getMonth() + 1).toString().padStart(2, '0') + '-' +
        currentDate.getDate().toString().padStart(2, '0');
    if (quoteModel.record["SBQQ__StartDate__c"] < todayDateFormat && quoteModel.record["SBQQ__Type__c"] == "Quote") {
        throw Error("Start date can not be in the past.");
    }

    //021801,021802
    var contractId = quoteModel.record["SBQQ__MasterContract__c"];
    var contractEndDate;
    var fetchId;
    var subscriptionRecord;
    var contractEarliestRenEndDate;
    var contractStartDate;

    for (let line of quoteLineModels) {
        if (line.record["SBQQ__RenewedSubscription__c"] != undefined) {
            fetchId = line.record["SBQQ__RenewedSubscription__c"];
            break;
        }
    }

    if ((fetchId != undefined || contractId != undefined) && (quoteModel.record["SBQQ__Type__c"] == "Amendment" || quoteModel.record["SBQQ__Type__c"] == "Renewal")) {
        var fetchById;
        if (contractId != undefined) {
            fetchById = 'SBQQ__Contract__c';
            fetchId = contractId;
        }
        else fetchById = 'id';

        //028616
        subscriptionRecord = await conn.query("SELECT Id, SBQQ__StartDate__c, SBQQ__EndDate__c, SBQQ__Contract__r.SBQQ__ExpirationDate__c, SBQQ__Contract__r.Earliest_Renewable_Endate__c, SBQQ__Contract__r.EndDate, SBQQ__Contract__r.StartDate FROM SBQQ__Subscription__c WHERE " + fetchById + "= '" + fetchId + "'");

        var mapOfSubscription = new Map();

        subscriptionRecord.records.forEach((sub) => {
            const key = sub.Id;
            if (key) {
                mapOfSubscription.set(key, sub);
            }
        });

        if (subscriptionRecord != undefined) {
            contractEndDate = subscriptionRecord.records[0].SBQQ__Contract__r.EndDate;
            contractEarliestRenEndDate = subscriptionRecord.records[0].SBQQ__Contract__r.Earliest_Renewable_Endate__c;
            contractStartDate = subscriptionRecord.records[0].SBQQ__Contract__r.StartDate;
        }
    }

    //021801,021802,023783
    var todayDate = new Date();
    todayDate.setDate(todayDate.getDate() - 1);
    var currentDate = todayDate.getFullYear() + '-' + (todayDate.getMonth() + 1).toString().padStart(2, '0') + '-' +
        todayDate.getDate().toString().padStart(2, '0');

    //020904
    if (quoteModel.record["SBQQ__Type__c"] == "Amendment" && (quoteModel.record["Sub_Type__c"] == undefined || quoteModel.record["Sub_Type__c"] == "Amendment")) contractEarliestRenEndDate = currentDate;
    //023480,020904
    if (quoteModel.record["SBQQ__Type__c"] == "Renewal" && (quoteModel.record["Sub_Type__c"] == undefined || quoteModel.record["Sub_Type__c"] == "Subscription Renewal") && quoteModel.record["Install_Earliest_End_Date__c"] != undefined) contractEarliestRenEndDate = quoteModel.record["Install_Earliest_End_Date__c"];

    //CR:029634
    if (quoteModel.record["SBQQ__Type__c"] == "Amendment" && quoteModel.record["Allow_For_Backdating__c"] === true) {
        var quoteCreatedDate = new Date(quoteModel.record["CreatedDate"]);
        quoteCreatedDate.setDate(quoteCreatedDate.getDate() - 120);
        var contractStartDateConverted = new Date(contractStartDate);
        if (new Date(quoteModel.record["SBQQ__StartDate__c"]) < contractStartDateConverted) {
            throw Error('Start Date can not be less than Contract Start Date');
        }
    }

    //CR-031092
    if ((quoteModel.record["SBQQ__Type__c"] == "Quote" || quoteModel.record["SBQQ__Type__c"] == "Amendment" || quoteModel.record["SBQQ__Type__c"] == "Renewal") && quoteModel.record["SBQQ__StartDate__c"] > quoteModel.record["SBQQ__EndDate__c"]) throw Error('Quote End Date cannot be earlier than the Start Date.');

    //026396
    if (quoteModel.record["ERP_Type__c"] == "Sherpa X") {
        quoteModel.record["Start_Date_Type__c"] = "Fixed Start Date";
    }

    for (let line of quoteLineModels) {
        //035512
        if (
            quoteModel.record["SBQQ__Type__c"] === "Amendment" &&
            quoteModel.record["ERP_Type__c"] === "Sherpa X" &&
            quoteModel.record["Invoice_Grouping_Preference__c"] === "BY PO NUMBER" &&
            line.record["SBQQ__UpgradedSubscription__c"] &&
            line.record["SBQQ__PriorQuantity__c"] != null
        ) {
            let currentQty = line.record["SBQQ__Quantity__c"] || 0;
            let priorQty = line.record["SBQQ__PriorQuantity__c"] || 0;

            if (currentQty > priorQty) {
                throw Error(
                    "Quantity increase is not allowed when Invoice Grouping Preference is set to 'By PO Number'. " +
                    "Please clone the existing line to increase the quantity."
                );
            }
        }

        //CR-026761
        if (quoteModel.record["Renewal_Type__c"] === 'Renewal Transition' && line.record["O2O_Attribute__c"] && line.record["O2O_Attribute_Percent__c"] !== null) {
            line.record["O2O_Attribute__c"] = (line.record["SBQQ__Discount__c"] === null) ? false : ((line.record["SBQQ__Discount__c"] !==
                line.record["O2O_Attribute_Percent__c"]) || quoteModel.record["Academic_Discount__c"] !== null || quoteModel.record["Software_Discount__c"] !== null || quoteModel.record["Training_Discount__c"] !== null || quoteModel.record["SBQQ__TargetCustomerAmount__c"] !== null || (line.group !== undefined && line.group.record["SBQQ__AdditionalDiscountRate__c"] !== null)) ? false : true;
        }

        // CR:030605
        if (quoteModel.record["SBQQ__Type__c"] == "Amendment" && quoteModel.record["Allow_For_Backdating__c"] === true &&
            line.record['SBQQ__UpgradedSubscription__c']
        ) {
            var quoteLineCreatedDate = new Date(line.record["CreatedDate"]);
            quoteLineCreatedDate.setDate(quoteLineCreatedDate.getDate() - 120);

            let upgradedSub = mapOfSubscription.get(line.record['SBQQ__UpgradedSubscription__c']);

            if (upgradedSub.SBQQ__StartDate__c != undefined && new Date(line.record["SBQQ__StartDate__c"]) < new Date(upgradedSub.SBQQ__StartDate__c)) {
                throw Error('Quote Line Start Date can not be less than of Original Quote Line Start Date.');
            }
        }

        if (line.record["SBQQ__UpgradedSubscription__c"] && line.record["Id"]) {
            quoteLineMap[line.Id] = line.record;
        }

        //CR:028165
        line.record["Start_Date_Type__c"] = "Fixed Start Date";

        //CR:027850
        if (line.record["Max_Subscription_Term__c"] !== null && line.record["Max_Subscription_Term__c"] > 0) {
            line.record["SBQQ__BillingFrequency__c"] = "57";
        }

        let data = {};
        data.pcsChanges = false;
        data.key = line.key;
        data.prodCategory = line.record["PP1_Category__c"];
        data.productCode = line.record["SBQQ__ProductCode__c"];
        data.prereqString = line.record["Product_Prereq__c"];
        data.id = line.record["Id"];
        data.addon =
            !line.record.parentItemKey &&
            line.record["Product_Flag__c"] === PROD_FLAG_ADDON
                ? true
                : false;
        data.division = line.record["Division__c"];
        data.licenseType = line.record["CPQ_License_Type__c"];
        data.quantity = line.record["SBQQ__Quantity__c"];
        data.accessRange = line.record["Access_Range__c"];
        data.highRoyalty = line.record["Royalty_Indicator__c"] === "HR" ? true : false;
        data.renewal = line.record["SBQQ__RenewedSubscription__c"] ? true : false;
        data.renewSub = line.record["SBQQ__RenewedSubscription__c"];
        data.equipmentNumbers = line.record["Prior_Equipment__c"];
        data.equipment = line.record["Prior_Equipment__c"] ? true : false;
        data.productFlag = line.record["Product_Flag__c"];
        data.ExternalMaterialGroup = line.record["External_Material_Group__c"];
        data.userType = line.record["User_Type__c"];
        data.startDate = line.record["SBQQ__StartDate__c"];
        data.prmes = line.record["PRMES_Product_Type__c"];
        data.billingFrequency = line.record["SBQQ__BillingFrequency__c"];
        data.source = line.record["SBQQ__Source__c"];
        data.quoteLineNumber = line.record["SBQQ__Number__c"];
        data.promoCode = line.record["Promo_Code__c"];
        data.effectiveStartDate = line.record["SBQQ__EffectiveStartDate__c"];
        data.effectiveEndDate = line.record["SBQQ__EffectiveEndDate__c"];

        // CR-15984
        if (line.parentGroupKey in groupMap && groupMap[line.parentGroupKey].record["Install__c"]) {
            line.record["Install__c"] = groupMap[line.parentGroupKey].record["Install__c"];
        } else if (quoteModel.record["Install__c"]) {
            line.record["Install__c"] = quoteModel.record["Install__c"];
        }

        //CR-026124
        if (!line.record["Entitlement_Group__c"]) {
            if (quoteModel.record["Entitlement_Group__c"]) {
                line.record["Entitlement_Group__c"] = quoteModel.record["Entitlement_Group__c"];
            }
        }

        // CR:031935
        if (quoteModel.record["ERP_Type__c"] == 'Sherpa X') {
            byKey.set(line.key, line);
            if (line.parentItemKey && byKey.has(line.parentItemKey) && line.record["SBQQ__ProductOption__c"] != null) {
                let parentLine = byKey.get(line.parentItemKey);
                line.record["Entitlement_Group__c"] = parentLine.record["Entitlement_Group__c"];
            }
        }

        if (quoteModel.record["ERP_Type__c"] != 'Sherpa X')
            data.install = line.record["Install__c"];
        else
            data.install = line.record["Entitlement_Group__c"];

        //CR-031102
        if (line.parentGroupKey in groupMap && groupMap[line.parentGroupKey].record["CPQ_License_Type__c"] && line.record["SBQQ__Product__r"].CPQ_License_Type__c.includes(groupMap[line.parentGroupKey].record["CPQ_License_Type__c"])) line.record["CPQ_License_Type__c"] = groupMap[line.parentGroupKey].record["CPQ_License_Type__c"];

        //CR 022895
        if (line.parentGroupKey in groupMap && groupMap[line.parentGroupKey].record["Support_Level__c"]) {
            //CR:027672, CR-028551
            if (line.record["Product_Process__c"] == undefined && line.record["Product_Support_Level__c"].includes(groupMap[line.parentGroupKey].record["Support_Level__c"]))
                line.record["Support_Level__c"] = groupMap[line.parentGroupKey].record["Support_Level__c"];
        }

        //CR-029723
        if (line.parentGroupKey in groupMap && groupMap[line.parentGroupKey].record["Global_Pricing__c"] && line.record["Global__c"] == 'Yes' && !quoteModel.record["Global_Pricing__c"])
            line.record["Global_Pricing__c"] = groupMap[line.parentGroupKey].record["Global_Pricing__c"];

        //CR-021800
        if (line.group !== undefined && quoteModel.record["SBQQ__Type__c"] == "Quote") {
            //025274, CR:028165
            if (line.group.record["Ramp_Group__c"] || line.group.record["Group_Type__c"] == 'Stage Delivery') line.record["Start_Date_Type__c"] = "Fixed Start Date";
            else line.record["Start_Date_Type__c"] = "Fixed Start Date";
        }
        else if (quoteModel.record["Start_Date_Type__c"] && quoteModel.record["SBQQ__Type__c"] == "Quote") {
            line.record["Start_Date_Type__c"] = quoteModel.record["Start_Date_Type__c"];
        }

        //026396
        if (quoteModel.record["ERP_Type__c"] == "Sherpa X") {
            line.record["Start_Date_Type__c"] = "Fixed Start Date";
        }

        data.restrictedClass = line.record["Restricted_Class__c"];
        data.globalPricing = line.record["Global_Pricing__c"];
        data.o2oAttribute = line.record["O2O_Attribute__c"];
        data.id = line.record["Id"];

        if ((line.record["SBQQ__Quantity__c"] != line.record["Previous_Quantity__c"]
            || line.record["Access_Range__c"] != line.record["Previous_Access_Range__c"]
            || line.record["CPQ_License_Type__c"] != line.record["Previous_License_Type__c"]) && quoteModel.record["Sub_Type__c"] != "Maintenance Renewal") {
            data.pcsChanges = true;
        }

        //CR-29306
        data.isBundleParent = line.record["SBQQ__Bundle__c"] ? true : false;
        data.requiredByKey = line.parentItemKey;
        data.entitlement = line.record["Entitlement__c"];
        quoteLines.push(data);

        // CR-16575, CR-16874, CR-017374
        if (line.record["Install__c"] && line.record["Restricted_Class__c"] && !restrictedMap[line.record["Install__c"]]) {
            if (line.record["Product_Class__c"] == undefined) {
                restrictedMap[line.record["Install__c"]] = line.record["Restricted_Class__c"];
            } else if (!line.record["Product_Class__c"].includes("ESP_PRODUCTS")) {
                restrictedMap[line.record["Install__c"]] = line.record["Restricted_Class__c"];
            } else {
                if (line.record["User_Type__c"] == "Node Locked") {
                    restrictedMap[line.record["Install__c"]] = line.record["Restricted_Class__c"];
                }
            }
        }

        //021801,021802, CR-027697
        if (quoteModel.record["SBQQ__Type__c"] == "Amendment" && (line.record["SBQQ__EffectiveStartDate__c"] < contractStartDate || line.record["SBQQ__EffectiveEndDate__c"] > contractEndDate)) {
            line.record["Allow_Error__c"] = true;
        } else {
            line.record["Allow_Error__c"] = false;
        }
    }

    let payload = {
        accountId: quoteModel.record.SBQQ__Account__c,
        priceBook: quoteModel.record.DISW_Price_Book__c,
        languageTranslation: quoteModel.record.Language_Translation__c,
        oppId: quoteModel.record.SBQQ__Opportunity2__c,
        quoteId: quoteModel.record.Id,
        quoteLineData: quoteLines,
        quoteType: quoteModel.record.SBQQ__Type__c,
        subType: quoteModel.record.Sub_Type__c,
        salesOrg: quoteModel.record.Sales_Org__c,
        promoCode: quoteModel.record.Promo_Code__c,
        promoStartDate: quoteModel.record.SBQQ__StartDate__c,
        salesChannel: quoteModel.record.Quote_Sales_Channel__c,
        promoEndDate: quoteModel.record.SBQQ__EndDate__c ? quoteModel.record.SBQQ__EndDate__c
            : toApexDate(calculateEndDate(quoteModel.record.SBQQ__StartDate__c, quoteModel.record.SBQQ__EffectiveEndDate__c, quoteModel.record.SBQQ__SubscriptionTerm__c))
    };

    let apexResult = await apexCallout(payload, conn);

    //034854
    quoteModel.__existingQuoteLineSourceByLineId =
        (apexResult && apexResult.existingQuoteLineSourceByLineId)
            ? apexResult.existingQuoteLineSourceByLineId
            : {};
    quoteModel.__liErrorMessage =
        (apexResult && apexResult.liErrorMessage)
            ? apexResult.liErrorMessage
            : null;

    // CR 028960
    if (apexResult.hasLicenseConflict === true && quoteModel.record["ERP_Type__c"] != 'Sherpa X') {
        if (window.sforce && window.sforce.one) {
            window.sforce.one.showToast({
                "message": "Nodelocked and Floating licenses cannot be on the same Install",
                "type": "warning",
                "duration": 500
            });
        }
    }

    //CR-035783
    if (apexResult.hasLicenseConflict === true && quoteModel.record["ERP_Type__c"] == 'Sherpa X') {
        if (window.sforce && window.sforce.one) {
            window.sforce.one.showToast({
                "message": "Nodelocked and Floating licenses cannot be on the same Entitlement Group",
                "type": "warning",
                "duration": 500
            });
        }
    }

    // CR-037024
    for (let line of quoteLineModels) {
        if (
            quoteModel.record["SBQQ__Type__c"] === "Amendment" &&
            quoteModel.record["ERP_Type__c"] === "Sherpa X" &&
            line.record["SBQQ__Existing__c"] === true &&
            line.group &&
            line.group.record["Group_Type__c"] === "Stage Delivery"
        ) {
            let currentQty = line.record["SBQQ__Quantity__c"] || 0;
            let priorQty = line.record["SBQQ__PriorQuantity__c"] || 0;

            if (currentQty > priorQty) {
                throw Error(
                    "Quantity increase is not allowed for existing Staged Delivery products during amendment. Please add a new product to increase quantity."
                );
            }
        }
    }

    //037012 - Auto Populate Dates When Cloning Staged Delivery Groups
    let groups = quoteModel.groups;
    let quoteERP = quoteModel.record["ERP_Type__c"];

    for (let i = 0; i < groups.length; i++) {
        let group = groups[i];

        if (group.record["Group_Type__c"] === "Stage Delivery" && quoteERP === "Sherpa X" && i > 0) {
            let prevGroup = groups[i - 1];

            if (prevGroup && prevGroup.record["SBQQ__EndDate__c"]) {
                let parts = prevGroup.record["SBQQ__EndDate__c"].split('-');
                let prevEndDate = new Date(parts[0], parts[1] - 1, parts[2]);
                prevEndDate.setDate(prevEndDate.getDate() + 1);

                let yyyy = prevEndDate.getFullYear();
                let mm = String(prevEndDate.getMonth() + 1).padStart(2, '0');
                let dd = String(prevEndDate.getDate()).padStart(2, '0');

                group.record["SBQQ__StartDate__c"] = `${yyyy}-${mm}-${dd}`;
            }
        }
    }

    // CR-15984, CR-028752
    for (let group of quoteModel.groups) {
        group.record["Install__c"] = null;
        group.record["SBQQ__AdditionalDiscountRate__c"] = null;

        //CR 022895
        if ((group.record["Support_Level__c"] != null && group.record["Support_Level__c"] != '') && quoteModel.record["Indirect_Direct_Opp__c"] == "INDIRECT") { throw Error('Support level cannot be set on indirect quotes'); }

        //CR-031102
        if (group.record["CPQ_License_Type__c"] != null && group.record["CPQ_License_Type__c"] != '' && quoteModel.record["SBQQ__Type__c"] != "Quote") {
            throw Error('CPQ License Type can only be set on New Quote');
        }

        group.record["Support_Level__c"] = null;
        group.record["Global_Pricing__c"] = false;
        group.record["CPQ_License_Type__c"] = null;

        //037011 - Auto Calculate End Date for Staged Delivery Group on QLIPage
        if (
            group.record["Group_Type__c"] === "Stage Delivery" &&
            group.record["SBQQ__StartDate__c"] &&
            group.record["SBQQ__SubscriptionTerm__c"] != null &&
            quoteModel.record["ERP_Type__c"] === "Sherpa X"
        ) {
            let parts = group.record["SBQQ__StartDate__c"].split('-');
            let startDate = new Date(parts[0], parts[1] - 1, parts[2]);
            let term = Number(group.record["SBQQ__SubscriptionTerm__c"]);

            if (!isNaN(term)) {
                let endDate = new Date(startDate);
                endDate.setMonth(endDate.getMonth() + term);
                endDate.setDate(endDate.getDate() - 1);

                let year = endDate.getFullYear();
                let month = String(endDate.getMonth() + 1).padStart(2, '0');
                let day = String(endDate.getDate()).padStart(2, '0');

                group.record["SBQQ__EndDate__c"] = `${year}-${month}-${day}`;
            }
        }
    }

    //{CR 022434
    var maxEffectiveTerm = 0;
    for (let line of quoteLineModels) {
        var trueTerm = getEffectiveSubscriptionTerm(quoteModel, line);
        if (maxEffectiveTerm < trueTerm) {
            maxEffectiveTerm = trueTerm;
        }

        line.record["Previous_Quantity__c"] = line.record["SBQQ__Quantity__c"];
        line.record["Previous_Access_Range__c"] = line.record["Access_Range__c"];
        line.record["Previous_License_Type__c"] = line.record["CPQ_License_Type__c"];

        //CR-027362, CR_036285
        if (quoteModel.record["SBQQ__Type__c"] === "Amendment" && quoteModel.record["SBQQ__Status__c"] === "Draft") {
            line.record["SAP_Zelo_Ref_Item__c"] = null;
            //CR-34400
            if (!quoteModel.record["Amendment_Type__c"] && line.record["Amendment_Type__c"]) {
                line.record["Amendment_Type__c"] = null;
            }
        }

        line.record["True_Effective_Term__c"] = trueTerm;

        // CR-15228
        if (quoteModel.record["Amendment_Type__c"]) {
            line.record["Amendment_Type__c"] = quoteModel.record["Amendment_Type__c"];

            if (line.record["SBQQ__Source__c"] && quoteModel.record["SBQQ__Status__c"] === "Draft") { //CR-036285
                for (let field in line.record) {
                    if (!field.startsWith("SBQQ__") && field.endsWith("__c")) {
                        if ((line.record["SBQQ__Source__c"] in quoteLineMap) && !IGNORE_CLONING_FIELDS.includes(field)) {
                            line.record[field] = quoteLineMap[line.record["SBQQ__Source__c"]][field];
                            if (field === "SAP_Zelo_Ref_Item__c") {
                                line.record["SAP_Zelo_Ref_Item__c"] = null;
                            }
                        }
                    }
                }
            }
        }

        if (apexResult) {
            // CR-16257
            if (line.key in apexResult.discountMap) {
                line.record["Contracted_Discount__c"] = apexResult.discountMap[line.key];
            }

            //CR-29306
            if (line.key in apexResult.teamcentersharedEntMap) {
                line.record["Teamcenter_Share_Entitlements__c"] = apexResult.teamcentersharedEntMap[line.key];
            }

            if (apexResult.validAddons) {
                if (
                    !line.record.parentItemKey &&
                    line.record["Product_Flag__c"] === PROD_FLAG_ADDON
                ) {
                    if (line.record["Install__c"] in apexResult.validAddons) {
                        line.record["Missing_Base__c"] = !apexResult.validAddons[line.record["Install__c"]];
                    } else {
                        line.record["Missing_Base__c"] = false;
                    }
                }
            }

            // CR-17079, CR-17374
            if (!line.parentItemKey) {
                let restrictedFlag = false;
                let skiprestricteCheck = false;
                if (line.record["Product_Class__c"] == undefined) {
                    skiprestricteCheck = false;
                } else if (line.record["Product_Class__c"].includes("ESP_PRODUCTS") && line.record["User_Type__c"] !== "Node Locked") {
                    skiprestricteCheck = true;
                }

                if (!skiprestricteCheck) {
                    if (restrictedMap[line.record["Install__c"]] && restrictedMap[line.record["Install__c"]] !== line.record["Restricted_Class__c"]) {
                        restrictedFlag = true;
                    } else if (apexResult.restrictedInstalls && apexResult.restrictedInstalls.length > 0 && apexResult.restrictedInstalls.includes(line.record["Install__c"])) {
                        restrictedFlag = true;
                    }
                }
                line.record["Restricted_Class_Error__c"] = restrictedFlag;

                // CR-022280
                line.record["Gobal_NonGlobal_Error__c"] = false;
                if (apexResult.globalNonGlobalInstalls && apexResult.globalNonGlobalInstalls.length > 0 && apexResult.globalNonGlobalInstalls.includes(line.record["Install__c"])) {
                    line.record["Gobal_NonGlobal_Error__c"] = true;
                }
            }

            if (
                line.key in apexResult.prereqResultMap &&
                !apexResult.prereqResultMap[line.key]
            ) {
                line.record["Missing_PreReq__c"] = true;
            } else {
                line.record["Missing_PreReq__c"] = false;
            }

            if (apexResult.entitlementMap && line.key in apexResult.entitlementMap) {
                let resultMap = apexResult.entitlementMap[line.key];
                line.record["ECA_Required__c"] = resultMap["ECA_Required"];
                line.record["Entitlement__c"] = resultMap["Entitlement"];
                line.record["Entitlement_Logic__c"] = resultMap["EntilementLogic"];
                line.record["Entitlement_on_Document__c"] = resultMap["EntilementOnDocument"];
                line.record["Additional_LSDA_Clauses__c"] = resultMap["AdditionalLSDAClauses"];
            }
        }

        if (apexResult.quoteLookUpDate == 0) {
            throw Error('Invalid Promo on Quote, Please apply a valid promo');
        }
        if (apexResult.lineLookUpDate == 0) {
            throw Error('Invalid Promo on Quote Line, Please apply a valid promo');
        }
    }

    quoteModel.record["True_Effective_Term__c"] = maxEffectiveTerm;
    let end = Date.now();

    //CR-026482
    for (let line of quoteLineModels) {
        if (line.record.SBQQ__ProductCode__c in apexResult.productQtyMap) {
            line.record["Total_Product_QTY__c"] = apexResult.productQtyMap[line.record.SBQQ__ProductCode__c];
        }

        //CR-030298
        if (quoteModel.record["Amendment_Type__c"] == 'Transfer') {
            if (line.record["Id"] in apexResult.amendmentPartnerDiscounts) {
                line.record["SBQQ__PartnerDiscount__c"] = apexResult.amendmentPartnerDiscounts[line.Id];
            }
        }

        // CR-035269
        if (apexResult.maintLineStampMap && line.record.Id && line.record.Id in apexResult.maintLineStampMap) {
            const maintLineStamp = apexResult.maintLineStampMap[line.record.Id];
            if (maintLineStamp) {
                for (let key in maintLineStamp) {
                    line.record[key] = maintLineStamp[key];
                }
            }
        }

        if (apexResult.lineStampMap && line.key && line.key in apexResult.lineStampMap) {
            const lineStamp = apexResult.lineStampMap[line.key];
            if (lineStamp) {
                for (let key in lineStamp) {
                    line.record[key] = lineStamp[key];
                }
            }
        }
    }
}
