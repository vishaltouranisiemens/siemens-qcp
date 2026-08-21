'use strict'

export function isVisible(fieldName, object, conn, objectName) {
    // CR:029634
    if (objectName === "Quote__c") {
        if (object.SBQQ__Type__c != "Amendment" ) {
            if (fieldName === "Allow_For_Backdating__c" ) {
                return false;
            }
        }
        //CR 031674
        if(object.Sub_Type__c === "Maintenance Renewal" && fieldName === "Amendment_Type__c"){
            return false;
        }
    }
    if (objectName === "QuoteLine__c") {
        //037305
        if ((fieldName === "SBQQ__StartDate__c" || fieldName === "SBQQ__EndDate__c") && (object.CPQ_License_Type__c === "EXTEND" || object.CPQ_License_Type__c === "TEST" || object.CPQ_License_Type__c === "BKUP") && object.SBQQ__Quote__r.Sub_Type__c !== "Maintenance Renewal") {
            return false;
        }
        if (object.Ramp_Key__c) {
            if (fieldName === "SBQQ__SubscriptionTerm__c" || fieldName === "SBQQ__EndDate__c") {
                return false;
            }
        }
        // CR-35007
        if( fieldName=='SBQQ__BillingFrequency__c' &&
            object.SBQQ__Quote__r.SBQQ__Status__c=='Draft' &&
            object.SBQQ__Quote__r.ERP_Type__c=='Sherpa X' &&
            object.Cost_Model__c!='CPC' &&
            object.Cost_Model__c!='CPM' &&
            object.SBQQ__Quote__r.SBQQ__Account__r.Org_Id__c) {
            return false;
        }
        //CR-030976
        if(object.SBQQ__Quote__r.Sub_Type__c != "Maintenance Renewal" && fieldName === "Serial_Number__c"){
            return false;
        }
        //CR-34899 & CR-30977
        const maintLicenseTypes = ['MAINT', 'TESTM', 'BKUPM'];
        if(fieldName === "Maint_Tier_Level__c") {
            if(!maintLicenseTypes.includes(object.CPQ_License_Type__c)) {
                return false;
            }
        }
        //CR-26696
        if( (object.Cost_Model__c != 'CPC' && fieldName === "CAP__c")){
            return false;
        }
        //CR-033137
        if (fieldName === "Current_partner_Price__c" || fieldName === "Current_List_Price__c") {
            if (object.SBQQ__Quote__r.Sub_Type__c !== "Maintenance Renewal") {
                return false;
            }
            const oppType = object.SBQQ__Quote__r.Indirect_Direct_Opp__c;
            if (oppType === "DIRECT") {
                return fieldName === "Current_List_Price__c";
            }
            if (oppType === "INDIRECT") {
                return (fieldName === "Current_partner_Price__c" || fieldName === "Current_List_Price__c");
            }
            return false;
        }
        // CR-16979
        if (fieldName === "LIC_NUMBER__c") {
            if ((object.Product_Access_Range__c && object.Product_Access_Range__c.includes("Node-Locked"))
                || (object.User_Type__c && object.User_Type__c.includes("Node Locked"))) {
                return true;
            }
            return false;
        }
        //CR-033672
        if(
            (object.SBQQ__Quote__r.Sub_Type__c == "Maintenance Renewal") &&
            (fieldName === "Entitlement__c" || fieldName === "T2X_Replacement__c" || fieldName === "Product_Support_Level__c" ||
             fieldName === "Provisioning_Lead_Time__c" || fieldName === "O2O_Attribute_Percent__c")
        ){
            return false;
        }
        // CR-15165
        if (fieldName === "NL_HOSTNAME__c") {
            if ((object.Product_Access_Range__c && object.Product_Access_Range__c.includes("Nodelocked"))
                || (object.User_Type__c && object.User_Type__c.includes("Node Locked"))) {
                return true;
            }
            return false;
        }
        // CR-15165
        if (
            (fieldName === "Access_Range__c" || fieldName === "FL_HOSTNAME1__c" || fieldName === "FL_HOSTNAME2__c" || fieldName === "FL_HOSTNAME3__c"
            || fieldName === "FL_HOSTID1__c" || fieldName === "FL_HOSTID2__c" || fieldName === "FL_HOSTID3__c") &&
            object.Product_Access_Range__c === "N/A"
        ) {
            return false;
        }
        if (
            fieldName === "Global_Pricing__c" &&
            object.Global__c &&
            object.Global__c.toLowerCase() === "no"
        ) {
            return false;
        }
        // CR-019680
        if(object.SBQQ__Quote__r.Hide_Fields_DirectQuote__c != undefined &&
            object.SBQQ__Quote__r.Hide_Fields_DirectQuote__c != null){
            var hidefields = new Set((object.SBQQ__Quote__r.Hide_Fields_DirectQuote__c).split(','));
            if (hidefields.has(fieldName)) {
                return false;
            }
        }
        //027576
        if (object.Cost_Model__c != "CPC" && (fieldName == "Included_Geos__c" || fieldName == "Excluded_Geos__c")) {
            return false;
        }
        //CR-035202
        const amendmentRestrictedFields = new Set([ 'SBQQ__Quantity__c']);
        if (amendmentRestrictedFields.has(fieldName) && object.SBQQ__Quote__r.SBQQ__Type__c === "Amendment" && object.SBQQ__UpgradedSubscription__c != null && (object.CPQ_License_Type__c === "MAINT" || object.CPQ_License_Type__c === "EXTEND")) {
            return false;
        }
        //CR26865
        if( (object.SBQQ__ChargeType__c == undefined || object.SBQQ__ChargeType__c != "Usage") && fieldName === "Cap__c"){
            return false;
        }
        //CR-030274
        if (fieldName === "Prior_ACV_12_Mth__c") {
            if (((object.SBQQ__RenewedSubscription__c != undefined && object.SBQQ__RenewedSubscription__c != null ) ||
                (object.Prior_Equipment__c != undefined && object.Prior_Equipment__c != null ) ||
                (object.SBQQ__UpgradedSubscription__c != undefined && object.SBQQ__UpgradedSubscription__c != null))) {
                return true;
            }
            return false;
        }
    }
    //CR-029907
    if (objectName === 'Quote__c' && object.SBQQ__Type__c === 'Amendment' && fieldName === 'SBQQ__TargetCustomerAmount__c') {
        return false;
    }
    return true;
}

export function isEditable(fieldName, object, conn, objectName) {
    if (objectName === "QuoteLine__c") {
        // CR:031935
        if((object.SBQQ__RequiredBy__r != null || object.SBQQ__ProductOption__c != null || object.SBQQ__OptionLevel__c >0)
            && fieldName === 'Entitlement_Group__c' && object.SBQQ__Quote__r.ERP_Type__c === 'Sherpa X' ){
            return false;
        }
        // CR-035269
        if((fieldName === "SBQQ__Quantity__c" || fieldName === "Install__c" || fieldName === "CPQ_License_Type__c") && object.SBQQ__Source__c && (object.CPQ_License_Type__c === "MAINT" || object.CPQ_License_Type__c === "TESTM" || object.CPQ_License_Type__c === "BKUPM") && object.SBQQ__Quote__r.Sub_Type__c !== "Maintenance Renewal") { return false; }
        //CR-034900
        if(fieldName === "Support_Level__c" && (object.CPQ_License_Type__c === "MAINT" || object.CPQ_License_Type__c === "EXTEND" || object.CPQ_License_Type__c === "TEST" || object.CPQ_License_Type__c === "TESTM"|| object.CPQ_License_Type__c === "BKUP" || object.CPQ_License_Type__c === "BKUPM" )){
            return false;
        }
        if (object.SBQQ__UpgradedSubscription__c) {
            if (fieldName === "SBQQ__Discount__c" || fieldName === "SBQQ__AdditionalDiscount__c" || fieldName === "SBQQ__AdditionalDiscountAmount__c") {
                return false;
            }
            // CR-032528
            if(fieldName === "SBQQ__Quantity__c" && object.SBQQ__Existing__c == true && object.SBQQ__Quote__r.SBQQ__Type__c === 'Amendment'
                && object.Cost_Model__c !='CPC' && object.SBQQ__ChargeType__c === 'Usage'){
                return false;
            }
        }
        // CR-034193
        if (fieldName === "SBQQ__BillingFrequency__c" && object.SBQQ__Quote__r.SBQQ__Type__c === "Renewal" && object.SBQQ__Quote__r.Sub_Type__c === "Maintenance Renewal") {
            return false;
        }
        //CR-031658
        const licenseValues = new Set(["1 MO", "2 HSMO", "H LOAN","1 LOAN"]);
        if(fieldName === "SBQQ__BillingFrequency__c" && licenseValues.has(object.CPQ_License_Type__c )){
            return false;
        }
        //034656 && 036363
        if (fieldName === "SBQQ__BillingFrequency__c" && (object.CPQ_License_Type__c === "EXTEND" || object.CPQ_License_Type__c === "TEST" || object.CPQ_License_Type__c === "BKUP") && object.SBQQ__Quote__r.Sub_Type__c !== "Maintenance Renewal") {
            return false;
        }
        //CR-017971, 023187, 031375, CR-035230
        const otoAttributeValue = new Set(["Z0","Z1", "Z3","Z4","T2X - Replacement Product"]);
        if(fieldName === "SBQQ__AdditionalDiscount__c" && object.SBQQ__Quote__r.SBQQ__Type__c === "Renewal"){
            if ( object.O2O_Attribute_Value__c != undefined && !otoAttributeValue.has(object.O2O_Attribute_Value__c)) {
                return false;
            }
        }
        //CR-035511
        if (
            fieldName === "SBQQ__AdditionalDiscount__c" &&
            object.SBQQ__Quote__r.SBQQ__Type__c === "Amendment" &&
            object.SBQQ__Quote__r.ERP_Type__c === "Sherpa X" &&
            object.SBQQ__Quote__r.Invoice_Grouping_Preference__c === "By PO Number"
        ) {
            if (object.SBQQ__Source__c) {
                return true;
            }
        }
        //CR-030766
        if (fieldName === "T2X_Replacement__c") {
            if (object.Product_Flag__c === "SaaS - Xflag" || object.Product_Flag__c === "LaaS" || object.Product_Flag__c === "SaaS - Fflag" || object.Product_Flag__c === "SaaS - Dflag" || object.Product_Flag__c === "SaaS - Eflag" || object.Product_Flag__c === "SaaS - Zflag" || object.Product_Flag__c === "SaaS - No Flag") {
                return true;
            } else {
                return false;
            }
        }
        //CR-023768
        if (fieldName === "SBQQ__StartDate__c" && object.SBQQ__Quote__r.SBQQ__Type__c === "Renewal" && ( (object.SBQQ__RenewedSubscription__c != undefined && object.SBQQ__RenewedSubscription__c != null ) || (object.Prior_Equipment__c != undefined && object.Prior_Equipment__c != null ) ) ) {
            return false;
        }
        // CR-15228
        if (object.Amendment_Type__c === "Transfer" && object.SBQQ__Source__c) {
            if (fieldName === "SBQQ__Quantity__c" || fieldName === "Install__c") {
                return true;
            }
            return false;
        }
        // CR-035919
        if (object.SBQQ__UpgradedSubscription__c && object.SBQQ__BillingFrequency__c === 'Custom Billing' && object.SBQQ__Quote__r.ERP_Type__c === 'Sherpa X') {
            if (fieldName === "SBQQ__Quantity__c") {
                return true;
            }
            return false;
        }
        // CR-028701
        if(fieldName === "T2X_Replacement__c" && object.QL_Concatenated_Indicator__c && !((object.QL_Concatenated_Indicator__c).includes("New") || (object.QL_Concatenated_Indicator__c).includes("T2X")) ){
            return false;
        }
        //CR-023186
        if (fieldName === "Partner_Total__c") return false;
        //CR-023994, CR-028373
        const excluded_ProductCodeSet = new Set(["SAASOPS7000","PS-CNSLTG"]);
        if(fieldName === 'SBQQ__ListPrice__c' && (!excluded_ProductCodeSet.has(object.SBQQ__ProductCode__c) || !object.SBQQ__Quote__r.SAASOPS_Price_Edit_Access__c)){
            return false;
        }
        // CR-027850
        if (fieldName === 'SBQQ__BillingFrequency__c' && (object.Max_Subscription_Term__c !== null && object.Max_Subscription_Term__c > 0)) {
            return false;
        }
        // CR-029755
        const conditionalReadOnlyFields = new Set([
            'CPQ_License_Type__c',
            'SBQQ__PackageProductDescription__c',
            'SBQQ__StartDate__c',
            'SBQQ__EndDate__c',
            'Support_Level__c',
            'Install__c',
            'SBQQ__BillingFrequency__c'
        ]);
        if (conditionalReadOnlyFields.has(fieldName)) {
            if (object.SBQQ__RequiredBy__c != null) {
                return false;
            }
        }
        //CR-032608
        if (fieldName === 'Entitlement_Group__c' && object.SBQQ__Quote__r.ERP_Type__c === 'Sherpa X' && object.SBQQ__UpgradedSubscription__c != null) {
            return false;
        }
        // CR-019680
        if(object.SBQQ__Quote__r.Readonly_Fields_QLE__c != undefined &&
            object.SBQQ__Quote__r.Readonly_Fields_QLE__c != null){
            var readFields = new Set((object.SBQQ__Quote__r.Readonly_Fields_QLE__c).split(','));
            if (readFields.has(fieldName)) {
                return false;
            }
        }
        // CR-032188
        if (object.Product_Flag__c === "On Premise" &&
            object.SBQQ__Quote__r.SBQQ__Type__c === "Amendment" &&
            object.SBQQ__UpgradedSubscription__c != null &&
            object.SBQQ__Quote__r.Readonly_Fields_QLE_On_Premise_Product__c != undefined &&
            object.SBQQ__Quote__r.Readonly_Fields_QLE_On_Premise_Product__c != null) {
            var onPremiseReadFields = new Set((object.SBQQ__Quote__r.Readonly_Fields_QLE_On_Premise_Product__c).split(','));
            if (onPremiseReadFields.has(fieldName)) {
                return false;
            }
        }
        //CR-032589, CR-34899
        const maintenanceRenewalReadOnlyFields = new Set([
            'Product_Flag__c',
            'CPQ_License_Type__c',
            'Install__c',
            'Current_List_Price__c',
            'Current_partner_Price__c',
            'Maint_Tier_Level__c'
        ]);
        if (maintenanceRenewalReadOnlyFields.has(fieldName)) {
            if (object.SBQQ__Quote__r.Sub_Type__c !== null && object.SBQQ__Quote__r.Sub_Type__c === "Maintenance Renewal") {
                return false;
            }
        }
    } else if (objectName === 'Quote__c') {
        //CR-031939
        if(object.Sub_Type__c === "Maintenance Renewal" && fieldName === "SBQQ__StartDate__c"){
            return false;
        }
        //CR-032589
        if(object.Sub_Type__c === "Maintenance Renewal" && fieldName === "Install__c"){
            return false;
        }
        if (object.EditLinesFieldSetName__c === 'LMS_Server_Fields') {
            return false;
        }
    } else if (objectName === 'QuoteLineGroup__c') {
        // no restrictions
    }
    return true;
}
