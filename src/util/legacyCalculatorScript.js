​/*
* This is a sample plugin for use in the new JavaScript Quote Calculator. It exports all of the methods that
* the calculator will look for, and documents their parameters and return types.
*
* These methods are all optional. One may export any, all, or none of them in order to achieve the desired behavior.
*
* Note that the plugin is an ES6 module. It is transpiled via Babel, and thus it is module-scoped by default. One may
* use any elements of the ES6 language or syntax. However, the plugin must be able to run in both Browser and Node
* environments. This means that one cannot expect browser global variables such as window to be available.
*/


/*********************************
* Field Security Plugin methods *
*********************************/

//CR-029891
var isQuoteContaionsCPCProductForYDPR;

export function isFieldVisibleForObject(fieldName, object, conn, objectName) {

// CR:029634
if (objectName === "Quote__c") {
if (object.SBQQ__Type__c != "Amendment" ) {
if (fieldName === "Allow_For_Backdating__c" ) {
return false;
}
}
//CR 031674--Start Here
if(object.Sub_Type__c === "Maintenance Renewal" && fieldName === "Amendment_Type__c"){
return false;
}
//CR 031674   --End Here
}
if (objectName === "QuoteLine__c") {
    // CR-032469
        if (object.SBQQ__ProductCode__c === 'STAR1003A') {
            if (fieldName === "SBQQ__SubscriptionTerm__c" || fieldName === "SBQQ__EndDate__c") {
                return false;
            }
        } 
//CR-030976
if(object.SBQQ__Quote__r.Sub_Type__c != "Maintenance Renewal" && fieldName === "Serial_Number__c"){
  return false;
}
//CR-36844
                if(object.SBQQ__Bundle__c === true && fieldName === "Total_Bundle_Discount__c" ){
            return false;
        }
//CR-34899 & CR-30977
const maintLicenseTypes = ['MAINT', 'TESTM', 'BKUPM'];
if(fieldName === "Maint_Tier_Level__c") { 
  if(!maintLicenseTypes.includes(object.CPQ_License_Type__c)) { 
    return false;
  }
}
//037305
if ((fieldName ===  "SBQQ__StartDate__c" || fieldName === "SBQQ__EndDate__c") && (object.CPQ_License_Type__c === "EXTEND" || object.CPQ_License_Type__c === "TEST" || object.CPQ_License_Type__c === "BKUP") && object.SBQQ__Quote__r.Sub_Type__c !== "Maintenance Renewal") {
    return false;
}
// hide subscription term and end date if line has ramp key populated (indicates it is part of a ramp group)
if (object.Ramp_Key__c) {
if (
fieldName === "SBQQ__SubscriptionTerm__c" ||
fieldName === "SBQQ__EndDate__c"
) {
return false;
}
}
//CR-26696
if( (object.Cost_Model__c != 'CPC'
&& fieldName === "CAP__c")){
return false;
}
//CR - 033137
if (fieldName === "Current_partner_Price__c" ||
fieldName === "Current_List_Price__c") {
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

// CR-16979: LIC NUMBER is also visible/editable when user type = node locked, separated from below conditional for NL HOSTNAME
if (fieldName === "LIC_NUMBER__c") {
if ((object.Product_Access_Range__c && object.Product_Access_Range__c.includes("Node-Locked"))
|| (object.User_Type__c && object.User_Type__c.includes("Node Locked"))) {
return true;
}
return false;
}

// CR-15165: hide node locked fields if access range != node-locked
if (fieldName === "NL_HOSTNAME__c") {
if ((object.Product_Access_Range__c && object.Product_Access_Range__c.includes("Node-Locked"))
|| (object.User_Type__c && object.User_Type__c.includes("Node Locked"))){
return true;
}
return false;
}

//CR-033672 - hide fields for CPQ MRO Quote
// Replace T2X_Replacement__c with Convert_Transform_To__c - 035628 // Replace Convert_Transform_To__c with Sales_Initiative__c 038084
if(
(object.SBQQ__Quote__r.Sub_Type__c == "Maintenance Renewal") && (fieldName === "Entitlement__c" || fieldName === "Sales_Initiative__c" || fieldName === "Product_Support_Level__c" ||fieldName === "Provisioning_Lead_Time__c" ||fieldName === "O2O_Attribute_Percent__c")
){
return false;
}

// CR-15165: hide following fields if access range does not have any applicable values
if (
(fieldName === "Access_Range__c" || fieldName === "FL_HOSTNAME1__c" || fieldName === "FL_HOSTNAME2__c" || fieldName === "FL_HOSTNAME3__c"
|| fieldName === "FL_HOSTID1__c" || fieldName === "FL_HOSTID2__c" || fieldName === "FL_HOSTID3__c") &&
object.Product_Access_Range__c === "N/A"
) {
return false;
}

// hide Global Pricing field on quote line if related product's 'Global__c' == 'No'
if (
fieldName === "Global_Pricing__c" &&
object.Global__c &&
object.Global__c.toLowerCase() === "no"
) {
return false;
}

// CR-019680 Hide fields for Direct Quote
if(object.SBQQ__Quote__r.Hide_Fields_DirectQuote__c != undefined &&
object.SBQQ__Quote__r.Hide_Fields_DirectQuote__c != null){
var hidefields = new Set((object.SBQQ__Quote__r.Hide_Fields_DirectQuote__c).split(','));
if (hidefields.has(fieldName)) {
return false;
}
}
//CR26865 - hide Monthly Cap if Charge type is non USage
if( (object.SBQQ__ChargeType__c == undefined ||
object.SBQQ__ChargeType__c != "Usage" )&& fieldName === "Cap__c"){
return false;
}

//027576- start
if (object.Cost_Model__c != "CPC" && (fieldName == "Included_Geos__c" || fieldName == "Excluded_Geos__c")) {
return false;
}
//027576- end

//CR-035202
const amendmentRestrictedFields = new Set([ 'SBQQ__Quantity__c']);
if (amendmentRestrictedFields.has(fieldName) && object.SBQQ__Quote__r.SBQQ__Type__c === "Amendment" &&object.SBQQ__UpgradedSubscription__c != null &&
(object.CPQ_License_Type__c === "MAINT" || object.CPQ_License_Type__c === "EXTEND")) {
return false;
}
//CR-030274
if (fieldName === "Prior_ACV_12_Mth__c") {
if (((object.SBQQ__RenewedSubscription__c != undefined && object.SBQQ__RenewedSubscription__c != null ) || (object.Prior_Equipment__c != undefined && object.Prior_Equipment__c != null ) || (object.SBQQ__UpgradedSubscription__c != undefined && object.SBQQ__UpgradedSubscription__c != null))) {
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

export async function isFieldEditableForObject(fieldName, object, conn, objectName) {
if (objectName === "QuoteLine__c") {
    
         // Added Below Condition As part of CR:031935
         if((object.SBQQ__RequiredBy__r != null || object.SBQQ__ProductOption__c != null || object.SBQQ__OptionLevel__c >0) 
             && fieldName === 'Entitlement_Group__c' && object.SBQQ__Quote__r.ERP_Type__c === 'Sherpa X' ){
            return false; 
         }
         // CR - 35007 Added to keep Billing frequency as Monthly
            if( fieldName=='SBQQ__BillingFrequency__c' &&
        object.SBQQ__Quote__r.SBQQ__Status__c=='Draft' &&
        object.SBQQ__Quote__r.ERP_Type__c=='Sherpa X' &&
        object.Cost_Model__c!='CPC' &&
        object.Cost_Model__c!='CPM' &&
        object.SBQQ__Quote__r.SBQQ__Account__r.Org_Id__c)
        {
            return false;
        } 
        
        // CR-035269
        if((fieldName === "SBQQ__Quantity__c" || fieldName === "Install__c" || fieldName === "CPQ_License_Type__c") && object.SBQQ__Source__c && (object.CPQ_License_Type__c === "MAINT" || object.CPQ_License_Type__c === "TESTM" || object.CPQ_License_Type__c === "BKUPM") && object.SBQQ__Quote__r.Sub_Type__c !== "Maintenance Renewal") { return false; }

//CR - 034900
if(fieldName === "Support_Level__c" && (object.CPQ_License_Type__c === "MAINT" || object.CPQ_License_Type__c === "EXTEND" || object.CPQ_License_Type__c === "TEST" || object.CPQ_License_Type__c === "TESTM"|| object.CPQ_License_Type__c === "BKUP" || object.CPQ_License_Type__c === "BKUPM" )){
return false;
}
//CR-037732
if(fieldName === "Custom_Name__c" && object.External_Material_Group__c != "FPG" && object.External_Material_Group__c != "FPL" ){
return false;
}
// prevent updates to amendment lines for discount fields
if (object.SBQQ__UpgradedSubscription__c) {
if (fieldName === "SBQQ__Discount__c" || fieldName === "SBQQ__AdditionalDiscount__c" || fieldName === "SBQQ__AdditionalDiscountAmount__c") {
return false;
}
 // To prevent updating the Quantity field for non-CPC products as part of CR 032528
      if(fieldName === "SBQQ__Quantity__c" && object.SBQQ__Existing__c == true && object.SBQQ__Quote__r.SBQQ__Type__c === 'Amendment'
        && object.Cost_Model__c !='CPC' && object.SBQQ__ChargeType__c === 'Usage'){
         return false; 
      }

}
// CR 034193
        if (fieldName === "SBQQ__BillingFrequency__c" && object.SBQQ__Quote__r.SBQQ__Type__c ===  "Renewal" && object.SBQQ__Quote__r.Sub_Type__c === "Maintenance Renewal") {
      return false;
      }
      //CR-037733 added HW to below line
            const licenseValues = new Set(["1 MO", "2 HSMO", "H LOAN","1 LOAN","HW"]);
        if(fieldName === "SBQQ__BillingFrequency__c" && licenseValues.has(object.CPQ_License_Type__c ) ){
            return false;
        }
         //034656 && Modified by 036363
        if (fieldName === "SBQQ__BillingFrequency__c" && (object.CPQ_License_Type__c === "EXTEND" || object.CPQ_License_Type__c === "TEST" || object.CPQ_License_Type__c === "BKUP") && object.SBQQ__Quote__r.Sub_Type__c !== "Maintenance Renewal") {
            return false;
        }
        
//CR-017971 : This logic will block the Additional Discount field on QLE
//023187 - Add O2O Attribute blank check
//031375 - Z3 attribute value should also be allowed for additional discount on renewal quotes
//CR-035230 - Additional Discount field to remain editable on quote lines where T2X = true
const otoAttributeValue = new Set(["Z0", "Z1", "Z3","Z4","T2X - Replacement Product"]);
if (fieldName === "SBQQ__AdditionalDiscount__c" && object.SBQQ__Quote__r.SBQQ__Type__c === "Renewal") {
if ( object.O2O_Attribute_Value__c != undefined && !otoAttributeValue.has(object.O2O_Attribute_Value__c)) {
return false;
}
}

//CR-035511 : This logic will enable to additional discounr field for Invoice grouping preference is BY PO NUMBER
        if (
    fieldName === "SBQQ__AdditionalDiscount__c" &&
    object.SBQQ__Quote__r.SBQQ__Type__c === "Amendment" &&
    object.SBQQ__Quote__r.ERP_Type__c === "Sherpa X" &&
    object.SBQQ__Quote__r.Invoice_Grouping_Preference__c === "By PO Number"
) {
    // allow editing only for cloned lines
    if (object.SBQQ__Source__c) {
        return true;
    }
}

//032608: Entitlement group is read only at the time of amendment for the Existing Quote Line.
if (fieldName === 'Entitlement_Group__c' && object.SBQQ__Quote__r.ERP_Type__c === 'Sherpa X' 
    && object.SBQQ__UpgradedSubscription__c != null && object.SBQQ__Quote__r.SBQQ__Type__c === 'Amendment' ) {
    return false;
}

//CR-023490 : This logic will block the Global pricing field on QLE in case of amendment for existing products
if (fieldName === "Global_Pricing__c" && object.SBQQ__Quote__r.SBQQ__Type__c === "Amendment" && object.SBQQ__UpgradedSubscription__c != null) {
return false;
}

//CR-023768 : This logic will block the Start Date field on QLE Renewal
if (fieldName === "SBQQ__StartDate__c" && object.SBQQ__Quote__r.SBQQ__Type__c === "Renewal" && ( (object.SBQQ__RenewedSubscription__c != undefined && object.SBQQ__RenewedSubscription__c != null ) || (object.Prior_Equipment__c != undefined && object.Prior_Equipment__c != null ) ) ) {
return false;
}

// CR-15228: if line is an amendment AND cloned, prevent editing all fields except quantity and install
if (object.Amendment_Type__c === "Transfer" && object.SBQQ__Source__c) {
if (fieldName === "SBQQ__Quantity__c" || fieldName === "Install__c") {
return true;
}
return false;
}

// CR-035919: Support CPQ Amendments with Custom/Non Linear Billing
if (object.SBQQ__UpgradedSubscription__c && object.SBQQ__BillingFrequency__c  === 'Custom Billing' && object.SBQQ__Quote__r.ERP_Type__c  === 'Sherpa X') {
if (fieldName === "SBQQ__Quantity__c") {
return true;
}
return false;
}

//CR-023186
if(fieldName === "Partner_Total__c") return false;

//CR-023994 : This logic will block List Price from being edited if it's not SAASOPS or they do not have permission to edit SAASOPS
//CR-028373: SAASOPS7001 has a list price assigned so we no longer need the list unit price editable. Therefore removed SAASOPS7001 from the excluded list.
const excluded_ProductCodeSet = new Set([
"SAASOPS7000",
"PS-CNSLTG"
]);
if(fieldName === 'SBQQ__ListPrice__c' && (!excluded_ProductCodeSet.has(object.SBQQ__ProductCode__c) || !object.SBQQ__Quote__r.SAASOPS_Price_Edit_Access__c)){
return false;
}
if(fieldName === 'SBQQ__BillingFrequency__c' &&
(object.Max_Subscription_Term__c !== null && object.Max_Subscription_Term__c > 0 )
){
return false;
}
//36844
if(object.SBQQ__Bundle__c === false && fieldName === "Total_Bundle_Discount__c" ){
return false;
        }

// CR-029755 --Dieep Ravi -- Read only on QLE--Start Here
const conditionalReadOnlyFields = new Set([
'CPQ_License_Type__c',
'SBQQ__PackageProductDescription__c',
'SBQQ__StartDate__c',
'SBQQ__EndDate__c',
'Support_Level__c',
'Install__c',
'SBQQ__BillingFrequency__c'
]);

const hardwareDivisions = new Set(['03', '07', '08']);// CR-037730


// Added via CR-030543
if(object.SBQQ__Quote__r.SBQQ__Type__c == 'Amendment' && object.SBQQ__UpgradedSubscription__c != null && fieldName === 'Support_Level__c'){
return false;
}

// Handle always-read-only fields conditionally
if (conditionalReadOnlyFields.has(fieldName)) {
  if (fieldName === 'CPQ_License_Type__c' && object.SBQQ__RequiredBy__r && object.SBQQ__RequiredBy__r.Bundle_Type__c === 'Altair') {
    if (hardwareDivisions.has(String(object.Division__c))) {
      return true;
    }
  }
  if (object.SBQQ__RequiredBy__c != null) {
return false;
}
}
// CR-029755 & 37730

// CR-019680 Read only on QLE
if(object.SBQQ__Quote__r.Readonly_Fields_QLE__c != undefined &&
object.SBQQ__Quote__r.Readonly_Fields_QLE__c != null){
var readFields = new Set((object.SBQQ__Quote__r.Readonly_Fields_QLE__c).split(','));
if (readFields.has(fieldName)) {
return false;
}
}
// CR- 037729 (Altair HW + GSCS HW) — fields read-only
if (object.SBQQ__Quote__r.SBQQ__Type__c === "Amendment" && object.SBQQ__UpgradedSubscription__c != null && object.Bundle_Type__c === "Altair" && object.Is_Bundle__c === true && object.SBQQ__Quote__r.Readonly_Fields_QLE_On_Premise_Product__c != undefined && object.SBQQ__Quote__r.Readonly_Fields_QLE_On_Premise_Product__c != null) {
var hwReadOnlyFields = new Set((object.SBQQ__Quote__r.Readonly_Fields_QLE_On_Premise_Product__c).split(','));
if (hwReadOnlyFields.has(fieldName)) {
return false;
}}
if (fieldName === 'Access_Range__c' && object.Bundle_Type__c === "Altair" && object.Is_Bundle__c === true) {
return false;
} // END CR- 037729
// Dileep Ravi - CR 032188--Read only fields for On Premise products on Amendment quotes
if (object.Product_Flag__c === "On Premise" &&
object.SBQQ__Quote__r.SBQQ__Type__c === "Amendment" &&
object.SBQQ__UpgradedSubscription__c != null &&
object.SBQQ__Quote__r.Readonly_Fields_QLE_On_Premise_Product__c != undefined &&
object.SBQQ__Quote__r.Readonly_Fields_QLE_On_Premise_Product__c != null) {

var onPremiseReadFields = new Set((object.SBQQ__Quote__r.Readonly_Fields_QLE_On_Premise_Product__c).split(','));
if (onPremiseReadFields.has(fieldName)) {
    //CR-039249
    if (fieldName === "SBQQ__Quantity__c" && object.SBQQ__Quote__r.ERP_Type__c === 'Sherpa X' && object.CPQ_License_Type__c === "FSUB") {
        return true;
    }
    if (fieldName === "SBQQ__StartDate__c" && object.SBQQ__Quote__r.ERP_Type__c === 'Sherpa X' && object.CPQ_License_Type__c === "FSUB") {
    
       const contractId = object.SBQQ__UpgradedSubscription__c;
 const fetchById = "Id"
if (contractId) {
    const subscriptionRecord = await conn.query("SELECT Id, TFC__c, SBQQ__StartDate__c, SBQQ__EndDate__c, SBQQ__Contract__r.SBQQ__ExpirationDate__c, SBQQ__Contract__r.Earliest_Renewable_Endate__c, SBQQ__Contract__r.EndDate, SBQQ__Contract__r.StartDate FROM SBQQ__Subscription__c WHERE " + fetchById + "= '" + contractId + "'");

        const sub = subscriptionRecord.records[0];
        console.log(object.SBQQ__StartDate__c);
        if (sub.TFC__c === 'N'){
        console.log(sub.TFC__c );
        return true;
         }
     console.log(sub );
    }
    
    
}
    return false;
    }
    return false;
}

// Dileep Ravi - CR032188 --End Here
//maintenance renewal read only fields - Ayushi badkul, 032589, CR-34899: Added Maint_Tier_Level__c as readOnly
const maintenanceRenewalReadOnlyFields = new Set([
        'Product_Flag__c',
        'CPQ_License_Type__c',
        'Install__c',
        'Current_List_Price__c',
        'Current_partner_Price__c',
        'Maint_Tier_Level__c'
]);

//CR-031035: Making Product_Flag__c field non-editable when Quote Sub Type = Maintenance Renewal
//032589 : Install on quote line should be ready-only in case of maintenance renewal
//CR-030968: Making CPQ_License_Type__c field non-editable when Quote Sub Type = Maintenance Renewal
if (maintenanceRenewalReadOnlyFields.has(fieldName)) {
if (object.SBQQ__Quote__r.Sub_Type__c !== null && object.SBQQ__Quote__r.Sub_Type__c === "Maintenance Renewal") {
    return false; // Make read-only if condition matches
}
}
/*
//CR-030968: Making CPQ_License_Type__c field non-editable when Quote Sub Type = Maintenance Renewal
if (fieldName === 'CPQ_License_Type__c' && (object.SBQQ__Quote__r.Sub_Type__c !== null && object.SBQQ__Quote__r.Sub_Type__c === "Maintenance Renewal")) {
return false;
}

//CR-031035: Making Product_Flag__c field non-editable when Quote Sub Type = Maintenance Renewal
if (fieldName === 'Product_Flag__c' && (object.SBQQ__Quote__r.Sub_Type__c !== null && object.SBQQ__Quote__r.Sub_Type__c === "Maintenance Renewal")) {
return false;
}*/

// CR-15230: prevent editing all header fields if QLE View (EditLinesFieldSetName__c) is set to LMS_Server_Fields
} else if (objectName === 'Quote__c') {
        
//CR 031939 --Start Here
if(object.Sub_Type__c === "Maintenance Renewal" && fieldName === "SBQQ__StartDate__c"){
    return false;
}
//CR 031939 --End Here
//032589
         if(object.Sub_Type__c === "Maintenance Renewal" && fieldName === "Install__c"){
            return false;
        }
        

if (object.EditLinesFieldSetName__c === 'LMS_Server_Fields') {
return false;
}
//CR 023490
if(fieldName === "Global_Pricing__c" && object.SBQQ__Type__c == 'Amendment'){
return false;
}

//CR-027191
if (fieldName === "Provisioning_Lead_Time_Date_Sync__c" && (object.SBQQ__Type__c === "Renewal" || object.SBQQ__Type__c === "Amendment")) {
return false;
}
} else if (objectName === 'QuoteLineGroup__c') {

}
return true;
}

/**
* This method is called by the calculator when the plugin is initialized.
* @param {QuoteLineModel[]} quoteLineModels An array containing JS representations of all lines in a quote
* @returns {Promise}
*/
export function onInit(quoteLineModels) {
return new Promise((resolve, reject) => {
// Perform logic here and resolve promise
//CR026688
for (var i = 0; i < quoteLineModels.length; i++) {

if (quoteLineModels[i].record["SBQQ__ChargeType__c"] == "Usage") {
quoteLineModels[i].calculateFullTermPrice = true;
}
}

resolve();
});
}

/**
* This method is called by the calculator before calculation begins, but after formula fields have been evaluated.
* @param {QuoteModel} quoteModel JS representation of the quote being evaluated
* @param {QuoteLineModel[]} quoteLineModels An array containing JS representations of all lines in the quote
* @returns {Promise}
*/
export async function onBeforeCalculate(quoteModel, quoteLineModels, conn) {

//CR-035419 - stopping users from modifying in QLE when Quote status is Denied or Expired
if (quoteModel.record["SBQQ__Status__c"] == "Denied" || quoteModel.record["SBQQ__Status__c"] == "Expired") {
throw Error('Modifications should be done on Draft status quotes only.');
}
// CR18181 - Promo Code Level check is not needed anymore
//if(quoteModel.record["Promo_Code__c"] != null && quoteModel.record["Promo_Code_Level__c"] == null ){
// throw Error('Please provide the proper Promo Code Level for the associated Promo Code');
//}
const PROD_FLAG_ADDON = "HSaaS Addon";

//CR-026381 - Validation message when Target customer amount and SAASOPS product is quoted
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

if (hasSaasopsProduct){
throw Error('Target Customer Amount is not supported with SAASOPS products, remove the Target Customer Amount and proceed.');
}

// CR-15228: set of custom fields to exclude from copying to cloned lines
const IGNORE_CLONING_FIELDS = ["Error_Alert__c", "Missing_Base__c", "License_Contact__c", "Missing_PreReq__c", "Ramp_Key__c", "Ramp_Id__c", "Ramp_Average_Price__c",
"Current_ACV_12_Mth__c",
"Original_Group_Id__c", "Previous_Quantity__c", 
"Previous_Access_Range__c", "Previous_License_Type__c", "Install__c"];
let start = Date.now();

if (quoteModel.groups.length > 0) {
populateRampGroupValues(quoteModel);
}

// quote line data to send to QCP Helper apex class
let quoteLines = [];

// map to store quote line record data for copying values from parent line to cloned lines
let quoteLineMap = {};
let groupMap = {};

 const byKey = new Map();  // Added  As part of CR:031935


// CR-15984: build map of quote line groups to copy install if set on group
for (let group of quoteModel.groups) {
groupMap[group.key] = group;
}

// CR-16575: stores set of restricted class values
let restrictedMap = {};

//CR-021801
if( quoteModel.record["Start_Date_Type__c"] == "Flexible Start Date" && quoteModel.record["SBQQ__Type__c"] == "Renewal" ){ throw Error('Renewal quotes cannot have Flexible Start Date Type.'); }

//CR-021802
if( quoteModel.record["Start_Date_Type__c"] == "Flexible Start Date" && quoteModel.record["SBQQ__Type__c"] == "Amendment" ){ throw Error('Amendment quotes cannot have Flexible Start Date Type.'); }

//CR-021800
if( quoteModel.record["Start_Date_Type__c"] == "Flexible Start Date" && quoteModel.record["SBQQ__EndDate__c"] != null ){ throw Error('End Date needs to be blank for Flexible Start Date type Quotes'); }

//CR-032650
       if(quoteModel.record["SBQQ__EndDate__c"] != null || quoteModel.record["SBQQ__EndDate__c"] != undefined){
            var originalDate = quoteModel.record["SBQQ__EndDate__c"];
            console.log("originalDate:", originalDate);
            const parts = originalDate.split('-');  // yyyy-mm-dd
            var existingEndDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
            console.log("existingEndDate:", existingEndDate);
            var curntDate = existingEndDate.getUTCDate().toString().padStart(2, '0');
            console.log("curntDate:", curntDate);
            
            // Last day of current month + 1
            const lastDay = new Date(Date.UTC(existingEndDate.getUTCFullYear(), existingEndDate.getUTCMonth() + 1, 0));
            lastDay.setUTCDate(lastDay.getUTCDate());
            const lastDayOfMonth = lastDay.getUTCDate().toString().padStart(2, '0');
            console.log("lastDayOfMonth:", lastDayOfMonth);

            if (quoteModel.record["Sub_Type__c"] == 'Maintenance Renewal' && curntDate >= 1 && curntDate < lastDayOfMonth && quoteModel.record["ERP_Type__c"] != "Sherpa X") {
            console.log("entered--inside");
                quoteModel.record["SBQQ__EndDate__c"] = existingEndDate.getUTCFullYear() + '-' + (existingEndDate.getUTCMonth() + 1).toString().padStart(2, '0') + '-' + lastDayOfMonth;
                console.log("Quote end date :", quoteModel.record["SBQQ__EndDate__c"]);
            }
        }

//CR:023783
// Calculate today's date
/*var currentDate= new Date();
currentDate.setDate(currentDate.getDate());
var todayDateFormat = currentDate.getFullYear() + '-' + (currentDate.getMonth() + 1).toString().padStart(2, '0') + '-' +
currentDate.getDate().toString().padStart(2, '0');
if(quoteModel.record["SBQQ__StartDate__c"] < todayDateFormat && quoteModel.record["SBQQ__Type__c"] == "Quote") {
throw Error("Start date can not be in the past.");
}*/

//021801,021802
var contractId = quoteModel.record["SBQQ__MasterContract__c"];
var contractEndDate;
var fetchId;
var subscriptionRecord;
var contractEarliestRenEndDate;

//028616 - Romesh - Variable to hold the Contract Start Date
var contractStartDate;

for (let line of quoteLineModels) {
if(line.record["SBQQ__RenewedSubscription__c"] != undefined){
fetchId = line.record["SBQQ__RenewedSubscription__c"];
break;
}
}
//021801,021802
if((fetchId != undefined || contractId != undefined) && (quoteModel.record["SBQQ__Type__c"] == "Amendment" || quoteModel.record["SBQQ__Type__c"] == "Renewal")){
var fetchById;
if(contractId != undefined) {
fetchById = 'SBQQ__Contract__c';
fetchId = contractId;
}
else fetchById = 'id';
//031970 start
let contractEndDate;
if (contractId ) {
const contractQuery = await conn.query("SELECT Id, EndDate FROM contract WHERE Id = '" + contractId + "'");
if (contractQuery.records.length > 0) {
contractEndDate = contractQuery.records[0].EndDate;
}}
console.log("Contract End Date:", contractEndDate);
if (contractEndDate) {
const quoteEndDate = quoteModel.record["SBQQ__EndDate__c"];
console.log("Quote End Date:", quoteEndDate);
if ( quoteEndDate && new Date(quoteEndDate) > new Date(contractEndDate)) {
throw new Error("End Date cannot be later than the Contract End Date.");
}
}
//031970 End
//028616 - Added Startdate in Query
        subscriptionRecord = await conn.query("SELECT Id, TFC__c, SBQQ__StartDate__c, SBQQ__EndDate__c, SBQQ__Contract__r.SBQQ__ExpirationDate__c, SBQQ__Contract__r.Earliest_Renewable_Endate__c, SBQQ__Contract__r.EndDate, SBQQ__Contract__r.StartDate FROM SBQQ__Subscription__c WHERE " + fetchById + "= '" + fetchId + "'"); //CR-040181 - Added TFC__c
        
        var mapOfSubscription = new Map();
        
        subscriptionRecord.records.forEach((sub) => {
            const key = sub.Id; // or sub.Id, or sub.SBQQ__Product__c, depending on your use case
            if (key) {
                mapOfSubscription.set(key, sub);
            }
        });
        //CR-040181 --Start Here
        var mapOfSubscriptionTFC = new Map();
        subscriptionRecord.records.forEach((sub) => { if (sub.Id) mapOfSubscriptionTFC.set(sub.Id, sub.TFC__c); });
        quoteModel.__mapOfSubscriptionTFC = mapOfSubscriptionTFC;
        //CR-040181 --End Here
        
if (subscriptionRecord != undefined) {
contractEndDate = subscriptionRecord.records[0].SBQQ__Contract__r.EndDate;
contractEarliestRenEndDate = subscriptionRecord.records[0].SBQQ__Contract__r.Earliest_Renewable_Endate__c;

//028616
contractStartDate = subscriptionRecord.records[0].SBQQ__Contract__r.StartDate;
}
}

console.log('contractStartDate:--'+contractStartDate);

//021801,021802
// Calculate today's date
var todayDate = new Date();
todayDate.setDate(todayDate.getDate() - 1);
var currentDate = todayDate.getFullYear() + '-' + (todayDate.getMonth() + 1).toString().padStart(2, '0') + '-' +
todayDate.getDate().toString().padStart(2, '0');
let allowedDate = new Date(todayDate); //CR-037588
allowedDate.setDate(allowedDate.getDate() - 45);
//020904
if (quoteModel.record["SBQQ__Type__c"] == "Amendment" && quoteModel.record["Sub_Type__c"] == undefined) contractEarliestRenEndDate = currentDate;
//023480,020904
//021801,021802,020904,025950
//028616Romesh - Restricting only P03 Quote allowing Backdate amendment for Sherpa X & adding Allow_For_Backdating__c check or CR:029634
 if ((quoteModel.record["SBQQ__Type__c"] == "Renewal" && new Date(quoteModel.record["SBQQ__StartDate__c"])<= allowedDate && quoteModel.record["Sub_Type__c"] != "Maintenance Renewal") || (quoteModel.record["SBQQ__Type__c"] == "Amendment" && quoteModel.record["Allow_For_Backdating__c"] === false && quoteModel.record["Sub_Type__c"] == undefined && quoteModel.record["SBQQ__StartDate__c"] <= contractEarliestRenEndDate ))  {
        throw Error('The Quote Start Date cannot be in the past.');
        }

//CR : 029634
if(quoteModel.record["SBQQ__Type__c"] == "Amendment" && quoteModel.record["Allow_For_Backdating__c"] === true ){
var quoteCreatedDate = new Date(quoteModel.record["CreatedDate"]);
quoteCreatedDate.setDate(quoteCreatedDate.getDate() - 120);
var contractStartDateConverted = new Date(contractStartDate);
if(new Date(quoteModel.record["SBQQ__StartDate__c"]) < contractStartDateConverted){
throw Error('Start Date can not be less than Contract Start Date');
}
//CR-032189 Removing 120 backdate limit
}

//CR-031092
if ((quoteModel.record["SBQQ__Type__c"] == "Quote" || quoteModel.record["SBQQ__Type__c"] == "Amendment" || quoteModel.record["SBQQ__Type__c"] == "Renewal") && quoteModel.record["SBQQ__StartDate__c"] > quoteModel.record["SBQQ__EndDate__c"]) throw Error('Quote End Date cannot be earlier than the Start Date.');

//026396
if(quoteModel.record["ERP_Type__c"] == "Sherpa X"){
quoteModel.record["Start_Date_Type__c"] = "Fixed Start Date";
}
//CR-027191
var maxDate;
var greaterDate;
var todayPlus10Days;
var backStartDate = false;
var provisioningRecordExist = false;

var todayPlus10Days = new Date();
todayPlus10Days.setDate(todayPlus10Days.getDate() + 10);
backStartDate = todayPlus10Days.getFullYear() + '-' + (todayPlus10Days.getMonth() + 1).toString().padStart(2, '0') + '-' +
todayPlus10Days.getDate().toString().padStart(2, '0');

//CR-027191
for (let line of quoteLineModels) {
var todayDate = new Date();

todayDate.setDate(todayDate.getDate() + Number(line.record["Provisioning_Lead_Time__c"]) + 10);
var currentDate = todayDate.getFullYear() + '-' + (todayDate.getMonth() + 1).toString().padStart(2, '0') + '-' +
todayDate.getDate().toString().padStart(2, '0');

if(Number(line.record["Provisioning_Lead_Time__c"]) != 0) provisioningRecordExist = true;
if(greaterDate == undefined)
greaterDate = currentDate;
if(currentDate > greaterDate)
greaterDate = currentDate;

  // CR : 030605 below for loop is for this CR also added SBQQ__StartDate__c in above subscription query
            if(quoteModel.record["SBQQ__Type__c"] == "Amendment" && quoteModel.record["Allow_For_Backdating__c"] === true && 
            line.record['SBQQ__UpgradedSubscription__c']
            ){
                var quoteLineCreatedDate = new Date(line.record["CreatedDate"]);
quoteLineCreatedDate.setDate(quoteLineCreatedDate.getDate() -120);
                let upgradedSub = mapOfSubscription.get(line.record['SBQQ__UpgradedSubscription__c']);
                console.log('***foundUpgSub---',upgradedSub);
                alert('test1' + '---' + quoteLineCreatedDate + '----' +new Date(line.record["SBQQ__StartDate__c"]));
                if(upgradedSub.SBQQ__StartDate__c != undefined && new Date(line.record["SBQQ__StartDate__c"]) < new Date(upgradedSub.SBQQ__StartDate__c)){
throw Error('Quote Line Start Date can not be less than Upgraded Subscription Start Date');
}
else if(line.record["SBQQ__StartDate__c"] != undefined && new Date(line.record["SBQQ__StartDate__c"]) < quoteLineCreatedDate){
throw Error('Quote Line Start Date can only be prior 120 Days to Quote Line Amendment Date');
}
}
}
console.log('log6');

//CR-027191
if(quoteModel.record["SBQQ__Type__c"] == "Quote" && provisioningRecordExist){
if(!quoteModel.record["Skip_Provisioning_Lead_Time_Date_Sync__c"]){
quoteModel.record["Provisioning_Lead_Time_Date_Sync__c"] = true;
quoteModel.record["Skip_Provisioning_Lead_Time_Date_Sync__c"] = true;
quoteModel.record["SBQQ__StartDate__c"] = greaterDate;
}else if(quoteModel.record["Provisioning_Lead_Time_Date_Sync__c"]){
if(quoteModel.record["Manual_Start_Date_Override__c"]){
quoteModel.record["SBQQ__StartDate__c"] = greaterDate;
quoteModel.record["Manual_Start_Date_Override__c"] = false;
}
}else if(!quoteModel.record["Provisioning_Lead_Time_Date_Sync__c"] && !quoteModel.record["Manual_Start_Date_Override__c"]){
quoteModel.record["SBQQ__StartDate__c"] = backStartDate;
quoteModel.record["Manual_Start_Date_Override__c"] = true;
}
quoteModel.record["Longest_Provision_Lead_Time_Start_Date__c"] = true;
}else{
quoteModel.record["Provisioning_Lead_Time_Date_Sync__c"] = false;
quoteModel.record["Longest_Provision_Lead_Time_Start_Date__c"] = false;
quoteModel.record["Skip_Provisioning_Lead_Time_Date_Sync__c"] = false;
}


// iterate over quote lines and build request to qcp helper apex class
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

if(quoteModel.record["Allow_For_Backdating__c"] === false)// CR:029634
{
//CR-027191
var todayDate;
todayDate = new Date();
if (quoteModel.record["SBQQ__Type__c"] == 'Quote') {
todayDate.setDate(todayDate.getDate() + Number(line.record["Provisioning_Lead_Time__c"]) + 10);
} else {
todayDate.setDate(todayDate.getDate() + Number(line.record["Provisioning_Lead_Time__c"]) + 3);
}
var currentDate = todayDate.getFullYear() + '-' + (todayDate.getMonth() + 1).toString().padStart(2, '0') + '-' + todayDate.getDate().toString().padStart(2, '0');

if(maxDate == undefined)
maxDate = currentDate;

if(quoteModel.record["Provisioning_Lead_Time_Date_Sync__c"]){
if(currentDate > maxDate)
maxDate = currentDate;
if(line.record["User_Overridden_StartDate__c"] && !line.record["User_Manual_Overridden_StartDate__c"])
line.record["User_Overridden_StartDate__c"] = false;
}else{
if(quoteModel.record["SBQQ__Type__c"] == 'Quote' || (quoteModel.record["SBQQ__Type__c"] == 'Renewal' && (line.record["SBQQ__RenewedSubscription__c"] == undefined && line.record["Ren_Subscription_Install_Line_End_Date__c"] == undefined )) || (quoteModel.record["SBQQ__Type__c"] == 'Amendment' && !line.record["SBQQ__Existing__c"])){
if (!line.record["User_Overridden_StartDate__c"] || line.record["User_Manual_Overridden_StartDate__c"]) {
if(line.record["Provisioning_Lead_Time__c"] != 0){
line.record["SBQQ__StartDate__c"] = currentDate;
}
line.record["User_Overridden_StartDate__c"] = true;
line.record["User_Manual_Overridden_StartDate__c"] = false;
}

//CR-37453: Validate the lead time breach, only if Provisioning_Lead_Time__c available.
if (quoteModel.record["SBQQ__Type__c"] == 'Quote' || (quoteModel.record["SBQQ__Type__c"] == 'Renewal' && (line.record["SBQQ__RenewedSubscription__c"] == undefined && line.record["Ren_Subscription_Install_Line_End_Date__c"] == undefined )) || (quoteModel.record["SBQQ__Type__c"] == 'Amendment' && !line.record["SBQQ__Existing__c"])) {
  if (line.record["Provisioning_Lead_Time__c"] != '0') {
    let nowDate = new Date();
    nowDate.setDate(nowDate.getDate() + Number(line.record["Provisioning_Lead_Time__c"]) + 1);
    let minStartDate = nowDate.getFullYear() + '-' + (nowDate.getMonth() + 1).toString().padStart(2, '0') + '-' + nowDate.getDate().toString().padStart(2, '0');
    
    // Validate start date. CR-37453: Missing SBQQ__StartDate__c is automatically considered a breach.
    if (!line.record["SBQQ__StartDate__c"] || line.record["SBQQ__StartDate__c"] < minStartDate) {
      line.record["Lead_Time_Breach__c"] = true;
    } else {
      line.record["Lead_Time_Breach__c"] = false;
    }
  } 
}

}
}
}

//CR-026761 moved o2oattribute logic from price rule
if (quoteModel.record["Renewal_Type__c"] === 'Renewal Transition' && line.record["O2O_Attribute__c"] && line.record["O2O_Attribute_Percent__c"] !== null) {
line.record["O2O_Attribute__c"] = (line.record["SBQQ__Discount__c"] === null) ? false : ((line.record["SBQQ__Discount__c"] !== line.record["O2O_Attribute_Percent__c"]) || quoteModel.record["Academic_Discount__c"] !== null || quoteModel.record["Software_Discount__c"] !== null || quoteModel.record["Training_Discount__c"] !== null || quoteModel.record["SBQQ__TargetCustomerAmount__c"] !== null || (line.group !== undefined && line.group.record["SBQQ__AdditionalDiscountRate__c"] !== null)) ? false : true;
}

// add amendment lines to quote to copy values for any potentially cloned lines
if (line.record["SBQQ__UpgradedSubscription__c"] && line.record["Id"]) {
quoteLineMap[line.Id] = line.record;
}


//CR:027850
if (line.record["Max_Subscription_Term__c"] !== null && line.record["Max_Subscription_Term__c"] > 0 )
{
line.record["SBQQ__BillingFrequency__c"] = "57";
}
// CR-032469
        if (line.record["SBQQ__ProductCode__c"] === 'STAR1003A') {
            line.record["SBQQ__SubscriptionTerm__c"] = 12;
            console.log('podSubscriptionTerm :' + line.record["SBQQ__SubscriptionTerm__c"]);
        } 

//CR:028165
line.record["Start_Date_Type__c"] = "Fixed Start Date";

let data = {};
data.pcsChanges = false;
data.key = line.key;
data.prodCategory = line.record["PP1_Category__c"];
data.productCode = line.record["SBQQ__ProductCode__c"];
data.prereqString = line.record["Product_Prereq__c"];
//CR 038264
data.erpType = line.record["ERP_TYPE__c"];
data.salesInitiative = line.record["Sales_Initiative__c"];
data.Upgradedsub = line.record["SBQQ__UpgradedSubscription__c"];
data.NetPrice = line.record["SBQQ__NetPrice__c"];
// Dileep Ravi CR 030298 --Start Here
data.id = line.record["Id"];
//Dileep Ravi CR 030298 --End Here
data.addon =
!line.record.parentItemKey &&
line.record["Product_Flag__c"] === PROD_FLAG_ADDON
? true
: false;
data.division = line.record["Division__c"];
data.licenseType = line.record["CPQ_License_Type__c"];
data.quantity = line.record["SBQQ__Quantity__c"];
data.effectiveQuantity = line.record["SBQQ__EffectiveQuantity__c"]; //CR-039249
data.accessRange = line.record["Access_Range__c"];
data.highRoyalty =
line.record["Royalty_Indicator__c"] === "HR" ? true : false;
data.renewal = line.record["SBQQ__RenewedSubscription__c"] ? true : false;
data.renewSub = line.record["SBQQ__RenewedSubscription__c"] ;
data.amendSub = line.record["SBQQ__UpgradedSubscription__c"] ;
data.equipmentNumbers = line.record["Prior_Equipment__c"];
data.equipment = line.record["Prior_Equipment__c"] ? true : false;
data.productFlag = line.record["Product_Flag__c"];
data.ExternalMaterialGroup = line.record["External_Material_Group__c"];
data.userType = line.record["User_Type__c"];

// CR-035269
data.startDate = line.record["SBQQ__StartDate__c"];
data.prmes = line.record["PRMES_Product_Type__c"];
data.billingFrequency = line.record["SBQQ__BillingFrequency__c"];
data.source = line.record["SBQQ__Source__c"];
data.quoteLineNumber = line.record["SBQQ__Number__c"];

//US - 013740
data.promoCode = line.record["Promo_Code__c"];
data.effectiveStartDate = line.record["SBQQ__EffectiveStartDate__c"];
data.effectiveEndDate = line.record["SBQQ__EffectiveEndDate__c"];
//CR- 037731 Start
data.bundleType = line.record.SBQQ__Product__r.Bundle_Type__c; 
//CR- 037731 End
// CR-15984: moved price rule to stamp install from ql group > quote and pass to qcp helper
// get qlif install is not populated on quote line, pull from ql group, otherwise pull from quote
// Commented if for CR 024170 !line.record["Install__c"
if (quoteModel.record["ERP_Type__c"] == "P03") {
if (line.parentGroupKey in groupMap && groupMap[line.parentGroupKey].record["Install__c"]) {
line.record["Install__c"] = groupMap[line.parentGroupKey].record["Install__c"];
} else if (quoteModel.record["Install__c"] ) {
line.record["Install__c"] = quoteModel.record["Install__c"];
}
}
//CR-039010
if (quoteModel.record["ERP_Type__c"] == "Sherpa X") {
if (line.parentGroupKey in groupMap && groupMap[line.parentGroupKey].record["Entitlement_Group__c"]) {
line.record["Entitlement_Group__c"] = groupMap[line.parentGroupKey].record["Entitlement_Group__c"];
}else if (quoteModel.record["Entitlement_Group__c"] ) {
line.record["Entitlement_Group__c"] = quoteModel.record["Entitlement_Group__c"];
}
}

 // Added Below Condition  As part of CR:031935
    if(quoteModel.record["ERP_Type__c"] == 'Sherpa X'){
        byKey.set(line.key,line);
        if(line.parentItemKey && byKey.has(line.parentItemKey) && line.record["SBQQ__ProductOption__c"] != null){
            let parentLine = byKey.get(line.parentItemKey);
            line.record["Entitlement_Group__c"] = parentLine.record["Entitlement_Group__c"];
        }
    }
//Romesh
if(quoteModel.record["ERP_Type__c"] != 'Sherpa X')
data.install = line.record["Install__c"];
else
data.install = line.record["Entitlement_Group__c"];

//CR-031102,CR-035719 copy CPQ License type from quote line group to quote lines
if ((quoteModel.record["SBQQ__Type__c"] !== "Amendment" || !line.record["SBQQ__Existing__c"]) && line.parentGroupKey in groupMap &&
groupMap[line.parentGroupKey].record["CPQ_License_Type__c"]) {
line.record["CPQ_License_Type__c"] = groupMap[line.parentGroupKey].record["CPQ_License_Type__c"];
}
//CR 022895 Copy support level from quote line group to quote lines
if (line.parentGroupKey in groupMap && groupMap[line.parentGroupKey].record["Support_Level__c"]) {
//CR:027672 - Add this Product Process check to ignore Productized service product
//CR-028551 added additional check to populate only valid support level
if(line.record["Product_Process__c"] == undefined && line.record["Product_Support_Level__c"].includes(groupMap[line.parentGroupKey].record["Support_Level__c"]))
line.record["Support_Level__c"] = groupMap[line.parentGroupKey].record["Support_Level__c"];
}

//CR-029723 global Pricing to quote lines in group
if(line.parentGroupKey in groupMap && groupMap[line.parentGroupKey].record["Global_Pricing__c"] && line.record["Global__c"] == 'Yes' && !quoteModel.record["Global_Pricing__c"])
line.record["Global_Pricing__c"] = groupMap[line.parentGroupKey].record["Global_Pricing__c"];

if (line.group !== undefined && quoteModel.record["SBQQ__Type__c"] == "Quote") {
//025274
//CR:028165 - Replace Flexible Start Date to Fixed in else If condition
if (line.group.record["Ramp_Group__c"] || line.group.record["Group_Type__c"] == 'Stage Delivery') line.record["Start_Date_Type__c"] = "Fixed Start Date";
else line.record["Start_Date_Type__c"] = "Fixed Start Date";
}
else if(quoteModel.record["Start_Date_Type__c"] && quoteModel.record["SBQQ__Type__c"] == "Quote"){
line.record["Start_Date_Type__c"] = quoteModel.record["Start_Date_Type__c"];
}

//026396
if(quoteModel.record["ERP_Type__c"] == "Sherpa X"){
line.record["Start_Date_Type__c"] = "Fixed Start Date";
}
// US-017079
data.restrictedClass = line.record["Restricted_Class__c"];
// CR-022280
data.globalPricing = line.record["Global_Pricing__c"];
// CR-027613
data.o2oAttribute = line.record["O2O_Attribute__c"];
// Dileep Ravi CR 030298 --Start Here
data.id= line.record["Id"]; 
// Dileep Ravi CR 030298 --End Here 

//029891
data.costModel = line.record["Cost_Model__c"];

// set flag if any PCS dependent fields were changed to make new api call
if ((line.record["SBQQ__Quantity__c"] != line.record["Previous_Quantity__c"]
|| line.record["Access_Range__c"] != line.record["Previous_Access_Range__c"]
|| line.record["CPQ_License_Type__c"] != line.record["Previous_License_Type__c"]) 
&& quoteModel.record["Sub_Type__c"] != "Maintenance Renewal") {
data.pcsChanges = true;
}
//CR-29306
data.isBundleParent = line.record["SBQQ__Bundle__c"] ? true : false;
data.requiredByKey = line.parentItemKey;
data.entitlement = line.record["Entitlement__c"]
quoteLines.push(data);

// CR-16575: check if product class != 'N/A' and restricted classes is empty, add class to set
// CR-16874: update to restricted class formula to simplify validation
// CR-017374 : Added ESP_PRODUCTS condition for Restricted products
if (line.record["Install__c"] && line.record["Restricted_Class__c"] && !restrictedMap[line.record["Install__c"]]) {
if(line.record["Product_Class__c"] == undefined ){
restrictedMap[line.record["Install__c"]] = line.record["Restricted_Class__c"];
} else if(!line.record["Product_Class__c"].includes("ESP_PRODUCTS")){
restrictedMap[line.record["Install__c"]] = line.record["Restricted_Class__c"];
}else{
if(line.record["User_Type__c"] == "Node Locked"){
restrictedMap[line.record["Install__c"]] = line.record["Restricted_Class__c"];
}
}
}
//021801,021802 , CR - 027697 Start

var startDate = line.effectiveStartDate != null ? line.effectiveStartDate : line.record["SBQQ__EffectiveStartDate__c"];
let quoteEndDate = quoteModel.record["SBQQ__EndDate__c"] ? new Date(quoteModel.record["SBQQ__EndDate__c"]) : null;
var endDate = line.effectiveEndDate != null ? line.effectiveEndDate: line.record["SBQQ__EffectiveEndDate__c"];
var trueTerm = getEffectiveSubscriptionTerm(quoteModel, line);
var trueEndDate = calculateEndDate(startDate, endDate, trueTerm);
if (quoteEndDate && trueEndDate > quoteEndDate) {
trueEndDate = quoteEndDate;
}
if(quoteModel.record["SBQQ__Type__c"] == "Amendment" && (line.record["SBQQ__EffectiveStartDate__c"] < contractStartDate || line.record["SBQQ__EffectiveEndDate__c"] > trueEndDate)) {
line.record["Allow_Error__c"] = true;
}else{
line.record["Allow_Error__c"] = false;
}

// CR - 027697 End
}

if(quoteModel.record["Allow_For_Backdating__c"] === false)// CR:029634
{
//CR-027191
for (let line of quoteLineModels) {
if(quoteModel.record["Provisioning_Lead_Time_Date_Sync__c"]){
if(maxDate != undefined){
if(quoteModel.record["SBQQ__Type__c"] == 'Quote' || (quoteModel.record["SBQQ__Type__c"] == 'Renewal' && (line.record["SBQQ__RenewedSubscription__c"] == undefined && line.record["Ren_Subscription_Install_Line_End_Date__c"] == undefined )) || (quoteModel.record["SBQQ__Type__c"] == 'Amendment' && !line.record["SBQQ__Existing__c"])){
let nowDate = new Date();
nowDate.setDate(nowDate.getDate() + Number(line.record["Provisioning_Lead_Time__c"]) + 1);
let minStartDate = nowDate.getFullYear() + '-' + (nowDate.getMonth() + 1).toString().padStart(2, '0') + '-' + nowDate.getDate().toString().padStart(2, '0');
if(!line.record["User_Overridden_StartDate__c"]){
line.record["SBQQ__StartDate__c"] = maxDate;
line.record["User_Overridden_StartDate__c"] = true;
line.record["User_Manual_Overridden_StartDate__c"] = true;
}

if(line.record["Provisioning_Lead_Time__c"] != '0' && (!line.record["SBQQ__StartDate__c"] || line.record["SBQQ__StartDate__c"] < minStartDate))
line.record["Lead_Time_Breach__c"] = true;
else
line.record["Lead_Time_Breach__c"] = false;
}
}
}else if(quoteModel.record["SBQQ__Type__c"] == 'Quote'){
if(line.record["SBQQ__StartDate__c"] == greaterDate && line.record["Provisioning_Lead_Time__c"] == 0){
line.record["SBQQ__StartDate__c"] = undefined;
}
}
}
}
// build json payload
let payload = {
accountId: quoteModel.record.SBQQ__Account__c,
priceBook: quoteModel.record.DISW_Price_Book__c,
languageTranslation: quoteModel.record.Language_Translation__c,
erpType: quoteModel.record.ERP_Type__c,
paymentTerms: quoteModel.record.Payment_Terms__c,
oppId: quoteModel.record.SBQQ__Opportunity2__c,
quoteId:quoteModel.record.Id, //034854
quoteLineData: quoteLines,
quoteType: quoteModel.record.SBQQ__Type__c,
subType: quoteModel.record.Sub_Type__c, // Added by Ajay Singh - 12/12/2025 - CR-033669
salesOrg: quoteModel.record.Sales_Org__c,
salesChannel: quoteModel.record.Quote_Sales_Channel__c,
promoCode: quoteModel.record.Promo_Code__c,
promoStartDate: quoteModel.record.SBQQ__StartDate__c,
promoEndDate: quoteModel.record.SBQQ__EndDate__c ? quoteModel.record.SBQQ__EndDate__c
: toApexDate(calculateEndDate(quoteModel.record.SBQQ__StartDate__c, quoteModel.record.SBQQ__EffectiveEndDate__c, quoteModel.record.SBQQ__SubscriptionTerm__c))
};
console.log(payload);
// callouot to qcp helper
let apexResult = await apexCallout(payload, conn);

//034854
quoteModel.__existingQuoteLineSourceByLineId =
(apexResult && apexResult.existingQuoteLineSourceByLineId)
    ? apexResult.existingQuoteLineSourceByLineId
    : {};
// quoteModel.__liErrorMessage =
//   (apexResult && apexResult.liErrorMessage)
//     ? apexResult.liErrorMessage
//     : null;
quoteModel.__mapInstallToLineError = (apexResult && apexResult.mapInstallToLineError)
// Dileep Ravi --CR 028960 --Start Here
if (apexResult.hasLicenseConflict === true) {
if (window.sforce && window.sforce.one) {
window.sforce.one.showToast({
"message": "Nodelocked and Floating licenses cannot be on the same Entitlement Group",
"type": "warning",
"duration": 500

   });
}
}
//CR-038264
quoteModel.__seedingEligibleLines =
(apexResult && apexResult.seedingEligibleLines)
? apexResult.seedingEligibleLines
: {};

//CR- 037731
if(apexResult.hasAltairExistingInstallConflict){
throw Error( 'Altair Bundles with both Software and Hardware Divisions cannot use existing Install, create new one');}  //CR- 037731



// CR- 037024 - Stage Delivery Quantity Increase Validation
for (let line of quoteLineModels) {
    //console.log('mapInstallToLineError---->'+JSON.stringify(mapInstallToLineError)+'----'+mapInstallToLineError[line.record["Install__c"]] + '----'+line.record["Install__c"]+'--'+line.record.Install__c +'----'+line.record.install);
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
    // if( mapInstallToLineError && mapInstallToLineError[line.record["Install__c"]] ){
    //     if( line.record["Error_Alert__c"] ){
    //         line.record["Error_Alert__c"] += mapInstallToLineError[line.record["Install__c"]];
    //     }else{
    //         line.record["Error_Alert__c"] = mapInstallToLineError[line.record["Install__c"]];
    //     }
    // }
}


//037012 - Venkat Boppudi -Auto Populate Dates When Cloning Staged Delivery Groups
 let groups = quoteModel.groups;
    let quoteERP = quoteModel.record["ERP_Type__c"];

for (let i = 0; i < groups.length; i++) {
    let group = groups[i];

    if (group.record["Group_Type__c"] === "Stage Delivery" && quoteERP === "Sherpa X" &&  i > 0) {
        let prevGroup = groups[i - 1];

        if (prevGroup && prevGroup.record["SBQQ__EndDate__c"]) {
            
            // --- THE FIX: Split string to avoid UTC shift ---
            let parts = prevGroup.record["SBQQ__EndDate__c"].split('-');
            
            // Create date using (Year, MonthIndex, Day)
            // This ensures it uses the user's LOCAL calendar
            let prevEndDate = new Date(parts[0], parts[1] - 1, parts[2]);

            // Start Date = previous End Date + 1
            prevEndDate.setDate(prevEndDate.getDate() + 1);

            let yyyy = prevEndDate.getFullYear();
            let mm = String(prevEndDate.getMonth() + 1).padStart(2, '0');
            let dd = String(prevEndDate.getDate()).padStart(2, '0');

            let formattedStartDate = `${yyyy}-${mm}-${dd}`;
            
            // Console log to see the logic happening in real-time
            console.log(`Group ${i} calculation:`);
            console.log(` - Source End Date: ${prevGroup.record["SBQQ__EndDate__c"]}`);
            console.log(` - New Start Date set to: ${formattedStartDate}`);

            group.record["SBQQ__StartDate__c"] = formattedStartDate;

        }
    }
}


// Dileep Ravi --CR 028960 --End Here
// CR-15984: clear out install from groups
for (let group of quoteModel.groups) {
group.record["Entitlement_Group__c"] = null;
group.record["Install__c"] = null;
// CR - 028752: clear out Additional Discount
group.record["SBQQ__AdditionalDiscountRate__c"] = null;
//CR 022895: throw error on indirect quotes
if( (group.record["Support_Level__c"]!=null && group.record["Support_Level__c"]!='') && quoteModel.record["Indirect_Direct_Opp__c"] == "INDIRECT" ){ throw Error('Support level cannot be set on indirect quotes'); }
//CR - 035719
const hasNonExistingLineInGroup = quoteLineModels.some(line =>line.parentGroupKey === group.key && !line.record["SBQQ__Existing__c"]);
if ( group.record["CPQ_License_Type__c"] && ((quoteModel.record["SBQQ__Type__c"] === "Amendment" && !hasNonExistingLineInGroup) ||(quoteModel.record["SBQQ__Type__c"] !== "Quote" && quoteModel.record["SBQQ__Type__c"] !== "Amendment") ) ) {
throw Error('CPQ License Type can only be set on New Quote');
}
//CR 022895: clear out support level from groups
group.record["Support_Level__c"] = null;
//CR-029723 clear Global Pricing on Group
group.record["Global_Pricing__c"] = false;
//CR-031102
group.record["CPQ_License_Type__c"] = null;
//037011 - Venkat Boppudi -Auto Calculate End Date for Staged Delivery Group on QLIPage
 if (
    group.record["Group_Type__c"] === "Stage Delivery" &&
    group.record["SBQQ__StartDate__c"] &&
    group.record["SBQQ__SubscriptionTerm__c"] != null  &&
    quoteModel.record["ERP_Type__c"] === "Sherpa X"
) {
    // 1. Parse the Start Date safely
    let parts = group.record["SBQQ__StartDate__c"].split('-');
    let startDate = new Date(parts[0], parts[1] - 1, parts[2]);
    
    // 2. Treat as number (using Number() is safer for Number fields)
    let term = Number(group.record["SBQQ__SubscriptionTerm__c"]);

    // 3. Safety check: Only run if we have a valid number
    if (!isNaN(term)) {
        let endDate = new Date(startDate);
        
        // Add months
        endDate.setMonth(endDate.getMonth() + term);

        // Subtract 1 day
        endDate.setDate(endDate.getDate() - 1);

        // 4. Format back to YYYY-MM-DD (Safe from Time Zone shifts)
        let year = endDate.getFullYear();
        let month = String(endDate.getMonth() + 1).padStart(2, '0');
        let day = String(endDate.getDate()).padStart(2, '0');
        
        let formattedEndDate = `${year}-${month}-${day}`;

        // Log the result to the browser console
        console.log("Calculated End Date:", formattedEndDate);

        group.record["SBQQ__EndDate__c"] = formattedEndDate;
    }
}

}


//{CR 022434-(Short Term Pricing Uplift for Products - QCP)
var maxEffectiveTerm = 0;
//CR 022434-(Short Term Pricing Uplift for Products - QCP)}
// iterate over quote lines and check the results returned from qcp helper
for (let line of quoteLineModels) {
//{CR 022434-(Short Term Pricing Uplift for Products - QCP)
var trueTerm = getEffectiveSubscriptionTerm(quoteModel, line);
if (maxEffectiveTerm < trueTerm) {
maxEffectiveTerm = trueTerm;
}
//CR 022434-(Short Term Pricing Uplift for Products - QCP)}
// set previous values for next calculation
line.record["Previous_Quantity__c"] = line.record["SBQQ__Quantity__c"];
line.record["Previous_Access_Range__c"] = line.record["Access_Range__c"];
line.record["Previous_License_Type__c"] = line.record["CPQ_License_Type__c"];
//{CR 022434-(Short Term Pricing Uplift for Products - QCP)
line.record["True_Effective_Term__c"] = trueTerm;
//CR-027362 Clear Zelo Ref Number from cloned line on Amendments
if (quoteModel.record["SBQQ__Type__c"] === "Amendment" && quoteModel.record["SBQQ__Status__c"] === "Draft") { //CR_036285
line.record["SAP_Zelo_Ref_Item__c"] = null;
//CR-34400: If user flips Amendment_Type__c back to empty on the quote, accordingly update the same on quote line.
  if (!quoteModel.record["Amendment_Type__c"] && line.record["Amendment_Type__c"]) {
    line.record["Amendment_Type__c"] = null;  
  }
}
//CR 022434-(Short Term Pricing Uplift for Products - QCP)}
// CR-15228: added logic to populate Amendment Type on ql and copy all custom fields to cloned lines (with some exceptions)
// populate amendment type on all quote lines to handle transfer scenarios
if (quoteModel.record["Amendment_Type__c"]) {
line.record["Amendment_Type__c"] = quoteModel.record["Amendment_Type__c"];

// if line is cloned, populate values on cloned line ignoring CPQ fields and any explicitly excluded custom fields
if (line.record["SBQQ__Source__c"]&& quoteModel.record["SBQQ__Status__c"] === "Draft") { //CR-036285
for (let field in line.record) {
if (!field.startsWith("SBQQ__") && field.endsWith("__c")) {
if ((line.record["SBQQ__Source__c"] in quoteLineMap) && !IGNORE_CLONING_FIELDS.includes(field)) {
line.record[field] = quoteLineMap[line.record["SBQQ__Source__c"]][field];
//CR-027362 Clear Zelo Ref Number from cloned line on Amendments
if (field === "SAP_Zelo_Ref_Item__c") {
line.record["SAP_Zelo_Ref_Item__c"] = null;
}
}

}
}
}
}

// null check on qcp helper result
if (apexResult) {

if(apexResult.areSelectedProductsInvalidSherpaX){
isQuoteContaionsCPCProductForYDPR = true;
}


// CR-16257: check if a discount is applicable and populate the contracted discount field - changed condition to not treat 0 as false
if (line.key in apexResult.discountMap) {
line.record["Contracted_Discount__c"] =
apexResult.discountMap[line.key];
}
//CR-29306
if (line.key in apexResult.teamcentersharedEntMap) {
line.record["Teamcenter_Share_Entitlements__c"] = apexResult.teamcentersharedEntMap[line.key];
}

// set flag on quote line if no base exists on quote or active install line items
if (apexResult.validAddons) {
// set flag for all addon HSaaS products
if (
!line.record.parentItemKey &&
line.record["Product_Flag__c"] === PROD_FLAG_ADDON
) {
if (line.record["Install__c"] in apexResult.validAddons) {
line.record["Missing_Base__c"] =
!apexResult.validAddons[line.record["Install__c"]];
} else {
line.record["Missing_Base__c"] = false;
}
}
}

// CR-17079: added set of installs that are violating restricted class requirements, refactored qcp to consolidate restrictive product logic
if (!line.parentItemKey) {
// CR-017374
let restrictedFlag = false;
let skiprestricteCheck = false;
if(line.record["Product_Class__c"] == undefined){
skiprestricteCheck = false;
}else if(line.record["Product_Class__c"].includes("ESP_PRODUCTS") && line.record["User_Type__c"] !== "Node Locked"){
skiprestricteCheck = true;
}

// CR-16575: skip this branch if there is no restricted class, error is already found or the current line is child ql
// CR-16874: update to restricted class formula to simplify validation
// CR-017374
if(!skiprestricteCheck){
if (restrictedMap[line.record["Install__c"]] && restrictedMap[line.record["Install__c"]] !== line.record["Restricted_Class__c"]) {
restrictedFlag = true;
} else if (apexResult.restrictedInstalls && apexResult.restrictedInstalls.length > 0 && apexResult.restrictedInstalls.includes(line.record["Install__c"])) {
restrictedFlag = true;
}
}
line.record["Restricted_Class_Error__c"] = restrictedFlag;
console.log('restricted class flag:', line.record["Restricted_Class_Error__c"]);
// CR-022280
// CR-040493 Start
// line.record["Gobal_NonGlobal_Error__c"] = false;
// if (apexResult.globalNonGlobalInstalls && apexResult.globalNonGlobalInstalls.length > 0 && apexResult.globalNonGlobalInstalls.includes(line.record["Install__c"])) {
//     line.record["Gobal_NonGlobal_Error__c"] = true;
// }
const installKey = quoteModel.record["ERP_Type__c"] === "Sherpa X" ? line.record["Entitlement_Group__c"] : line.record["Install__c"];
line.record["Gobal_NonGlobal_Error__c"] = false;
console.log('installKey',installKey);
if (apexResult.globalNonGlobalInstalls && apexResult.globalNonGlobalInstalls.length > 0
    && installKey && apexResult.globalNonGlobalInstalls.includes(installKey)) {
    console.log('inside if');
    line.record["Gobal_NonGlobal_Error__c"] = true;
    console.log('line.record["Gobal_NonGlobal_Error__c"]',line.record["Gobal_NonGlobal_Error__c"]);
}
// CR-040493 End
}

// check prereq results, prereq result for quote line = false if all prereqs are NOT satisfied
if (
line.key in apexResult.prereqResultMap &&
!apexResult.prereqResultMap[line.key]
) {
// Missing prereq field will be checked if result = false
line.record["Missing_PreReq__c"] = true;
} else {
line.record["Missing_PreReq__c"] = false;
}
// populate PCS entitlements on ql
// Dileep Ravi CR038774 - Start Here
if (line.record["Product_Flag__c"] === 'On Premise') {
    line.record["ECA_Required__c"] = false;
}
// Dileep Ravi CR038774 - End here
if (apexResult.entitlementMap && line.key in apexResult.entitlementMap) {
let resultMap = apexResult.entitlementMap[line.key];
// Dileep Ravi CR038774 - Start here
if (line.record["Product_Flag__c"] !== 'On Premise') {
        line.record["ECA_Required__c"] = resultMap["ECA_Required"];
    }
// Dileep Ravi CR038774 - End here
line.record["Entitlement__c"] = resultMap["Entitlement"];
line.record["Entitlement_Logic__c"] = resultMap["EntilementLogic"];
line.record["Entitlement_on_Document__c"] = resultMap["EntilementOnDocument"];
line.record["Additional_LSDA_Clauses__c"] = resultMap["AdditionalLSDAClauses"];
}
}

// IJ (12/11 - Duplicate check not needed anymore
//if(apexResult.quoteLookUpDate == 2){
// throw Error ('Duplicate Promo found on Quote level.');
//}

//else
if(apexResult.quoteLookUpDate == 0){
throw Error('Invalid Promo on Quote, Please apply a valid promo');
}

if(apexResult.lineLookUpDate == 0){
throw Error('Invalid Promo on Quote Line, Please apply a valid promo');
}

}
//{CR 022434-(Short Term Pricing Uplift for Products - QCP)
quoteModel.record["True_Effective_Term__c"] = maxEffectiveTerm;
//CR 022434-(Short Term Pricing Uplift for Products - QCP)}
let end = Date.now();
console.log(`duration before calculate: ${(end - start) / 1000} s`);




//CR-026482 Setting the total product qty on each line items. Includes qty from all items on quote and install.
for (let line of quoteLineModels) {
if (line.record.SBQQ__ProductCode__c in apexResult.productQtyMap) {
line.record["Total_Product_QTY__c"] = apexResult.productQtyMap[line.record.SBQQ__ProductCode__c ];
}
console.log('Ttotal Product QTY >>>',line.record.Total_Product_QTY__c);

//Dileep Ravi CR --030298 --Start Here
if (quoteModel.record["Amendment_Type__c"]  == 'Transfer') {
if (line.record["Id"] in apexResult.amendmentPartnerDiscounts) {
line.record["SBQQ__PartnerDiscount__c"] = apexResult.amendmentPartnerDiscounts[line.Id];
}
}
//Dileep Ravi CR --030298 --End Here
       
        // CR-035269
        if(apexResult.maintLineStampMap && line.record.Id && line.record.Id in apexResult.maintLineStampMap){
            
            const maintLineStamp = apexResult.maintLineStampMap[line.record.Id];
            if(maintLineStamp){
                for(let key in maintLineStamp){
                    line.record[key] = maintLineStamp[key];
                }
            }
        }
        if(apexResult.lineStampMap && line.key && line.key in apexResult.lineStampMap){
            const lineStamp = apexResult.lineStampMap[line.key];
            if(lineStamp){
                for(let key in lineStamp){
                    line.record[key] = lineStamp[key];
                }
            }
        }
}
}
//End of CR-026482

/**
* This is method is called by the quote line promo code validation. US - 013740
* @param {}
* @returns {Integer}
*/
function validateQuoteLinePromo(quoteLineModels,issueLineObj){
let flag = false;
let qlValidate = true;

for(let item of quoteLineModels){

if(item.record["Promo_Code__c"]){
if(item.record["Promo_Code_Start_Date__c"]
&& item.record["Promo_Code_End_Date__c"]
&& item.record["Promo_Code_Sales_Org__c"]
&& item.record["SBQQ__EffectiveStartDate__c"]
&& item.record["Sales_Org__c"]){
console.log('--1--'+item.record["Name"]+'---->'+containsSalesOrg(item.record["Promo_Code_Sales_Org__c"],item.record["Sales_Org__c"])+"----SBQQ_QuoteLine.Promo_Code_Sales_Org__c Contains ---SBQQ__Quoteline.Sales_Org__c?");
console.log('--2--'+item.record["Name"]+'---->'+(item.record["SBQQ__EffectiveStartDate__c"] < item.record["Promo_Code_Start_Date__c"])+"-----effective-start-date:"+item.record["SBQQ__EffectiveStartDate__c"]+"--<--promo-code-start-date:"+item.record["Promo_Code_Start_Date__c"]);
console.log('--3--'+item.record["Name"]+'---->'+(item.record["SBQQ__EffectiveStartDate__c"] > item.record["Promo_Code_End_Date__c"])+"-----effective-start-date:"+item.record["SBQQ__EffectiveStartDate__c"]+"-->--promo-code-end-date:"+item.record["Promo_Code_End_Date__c"]);

if((item.record["SBQQ__EffectiveStartDate__c"] < item.record["Promo_Code_Start_Date__c"])
|| (item.record["SBQQ__EffectiveStartDate__c"] > item.record["Promo_Code_End_Date__c"])
|| !containsSalesOrg(item.record["Promo_Code_Sales_Org__c"],item.record["Sales_Org__c"])){

qlValidate = false;
issueLineObj.lineName = item.record["SBQQ__Number__c"];
issueLineObj.productName = item.record["SBQQ__ProductName__c"];
return false;
}
}
}
}

return qlValidate;
}

/**
* This is method is called by the quote line promo code validation. US - 013740
* @param {QuoteLineModel[]}
* @returns {Integer}
*/
function containsSalesOrg(promoSales, sales){
if(promoSales != null && sales != null){
let salesOrgs = promoSales.split(';');
return salesOrgs.includes(sales.trim());
}
return false;
}


/**
* This method is called by the calculator before price rules are evaluated.
* @param {QuoteModel} quoteModel JS representation of the quote being evaluated
* @param {QuoteLineModel[]} quoteLineModels An array containing JS representations of all lines in the quote
* @returns {Promise}
*/
export function onBeforePriceRules(quoteModel, quoteLineModels) {
return new Promise((resolve, reject) => {
// Perform logic here and resolve promise
resolve();
});
}

/**
* This method is called by the calculator after price rules are evaluated.
* @param {QuoteModel} quoteModel JS representation of the quote being evaluated
* @param {QuoteLineModel[]} quoteLineModels An array containing JS representations of all lines in the quote
* @returns {Promise}
*/
export function onAfterPriceRules(quoteModel, quoteLineModels) {
return new Promise((resolve, reject) => {
let installSupportMap = new Map(); // CR-022892
let installIdsSupportMismatch = new Set(); // CR-022892

const MSG = 'Error: Products with different Licensing Groups cannot be added to the same Install';

        const conflictInstalls =
            (quoteModel.apexResult && quoteModel.apexResult.licenseGroupConflictInstalls) || [];

        quoteLineModels.forEach(line => {

            const inst = line.record.Install__c;
            let err = line.record.Error_Alert__c || '';

            const hasMsg = err.includes(MSG);

            const isConflict = inst && conflictInstalls.includes(inst);

            if (isConflict) {
                if (!hasMsg) {
                    line.record.Error_Alert__c = err ? err + ' | ' + MSG : MSG;
                }
            } else {
                if (hasMsg) {
                    line.record.Error_Alert__c =
                        err.replace(' | ' + MSG, '').replace(MSG, '').trim();
                }
            }
        });
//  Collect support levels per EXISTING install
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
        }else{
            if(!installSupportMap.get(installId).has(line.record.Support_Level__c.trim())){
                installIdsSupportMismatch.add(installId);
            }
        }
    }
});

// CR-022892
quoteLineModels.forEach(function (line) {

    // CR-022892 start
    let supportLevel = line.record["Support_Level__c"];
    let productSupportLevel = line.record["Product_Support_Level__c"];
    let hasMismatch = false;

    // CR-033981 - Modified the logic to check for support mismatch
    if (productSupportLevel && productSupportLevel !== 'N/A') {
        const supportLevels = productSupportLevel
            .split(';')
            .map(v => v.trim())
            .filter(Boolean);

        if (!supportLevel || !supportLevels.includes(supportLevel.trim())) {
            hasMismatch = true; // Set hasMismatch to true if any mismatch is found
        }
    }

    if(line.record["Install__c"] || line.record["Entitlement_Group__c"]) {
        //CR:030493
        //CR-030543
        //  CR-022892 - Modified by Ajay Singh - 01/29/2026 - Removed the condition to check for New Install only. 
        if(((line.record["Install__c"] && line.record["Install__r"].Name !== null && line.record["Install__r"].Name != undefined) 
            || (line.record["Entitlement_Group__c"] && line.record["Entitlement_Group__r"].Name != undefined 
                && line.record["Entitlement_Group__r"].Name.includes('New EG'))) 
            && hasMismatch
            && quoteModel.record["Indirect_Direct_Opp__c"] === 'DIRECT') {
            line.record["New_Install_Validation__c"] = true;
        }else{
            line.record["New_Install_Validation__c"] = false;
        }
        //CR:030493
        //CR-030543
        if (((line.record["Install__c"] && line.record["Install__r"].Name != undefined && installIdsSupportMismatch.has(line.record["Install__c"]))
                /*|| (line.record["Entitlement_Group__c"] && line.record["Entitlement_Group__r"].Name != undefined  && !line.record["Entitlement_Group__r"].Name.includes('New EG'))*/) 
            && quoteModel.record["Indirect_Direct_Opp__c"] === 'DIRECT') {
                line.record["Existing_New_Install_Validation__c"] = true;
        } else {
                line.record["Existing_New_Install_Validation__c"] = false;
        }
    }
});

// Perform logic here and resolve promise
// US - 013740
let quotelineObj = {
lineName:'',
productName:''
};
if(!validateQuoteLinePromo(quoteLineModels,quotelineObj)){
throw Error('Invalid Promo Code Applied to Quote Line #'+quotelineObj.lineName+' for Product '+quotelineObj.productName);
}
resolve('Success!');
});
}

/**
* This method is called by the calculator after calculation has completed, but before fQormula fields are
* re-evaluated.
* @param {QuoteModel} quoteModel JS representation of the quote being evaluated
* @param {QuoteLineModel[]} quoteLineModels An array containing JS representations of all lines in the quote
* @returns {Promise}
*/
export function onAfterCalculate(quoteModel, quoteLineModels, conn) {
return new Promise(async (resolve, reject) => {
let start = Date.now();
// Perform logic here and resolve promise

var maxEffectiveEndDate = null;
var maxEffectiveTerm = 0;
//CR-027296
var minEffectiveStartDate = null;
/* CR-032601 - Added by PH: Backward/Forward Maintenance Date Calculation for Maintenance Renewal quotes */
let maxLineEndDate = null;
let maxLineEndDateAll = null;
let platforms = new Set();
let installs = new Set();
let tcs = new Set();
let legalAttributes = new Set();
let sapServerIdValues = new Set(); // CR-022892
let firstSupportLevel = null;// CR-022892
let hasMismatch = false;// CR-022892
let hasMismatchProductSupportLevel = false;// CR-022892
// CR-035269
const maintLicenseTypes = new Set(['MAINT', 'TESTM', 'BKUPM']);
const extendLicenseTypes = new Set(['EXTEND', 'TEST', 'BKUP']);
let extendLines = new Set();
let sourceToClonedMap = new Map();

/* CR-032601 - Added by PH: Backward/Forward Maintenance Date Calculation for Maintenance Renewal quotes */
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
line.record["Additional_LSDA_Clauses__c"] = null;}//CR-36094
console.log('isQuoteContaionsCPCProductForYDPR:--' + isQuoteContaionsCPCProductForYDPR);
//029891
if (line.record["Cost_Model__c"] == "CPC" && isQuoteContaionsCPCProductForYDPR) {

let errorMsg = line.record["Error_Alert__c"];

line.record["Error_Alert__c"] = errorMsg + " Error: This is a Prepayment quote, please replace this with a SAAS equivalent CPC product.";

}
console.log('fght:--' + line.record["Error_Alert__c"]);
if(line.record["AdditionalDiscountRate__c"] != '0' &&
line.record["AdditionalDiscountRate__c"] != null &&
quoteModel.record["SBQQ__Status__c"] == 'Draft' &&
line.record["Price_Segment__c"] != '1P101' &&
line.record["Division__c"] == '01' ){
line.record["SBQQ__Discount__c"] = line.record["AdditionalDiscountRate__c"];
}

// CR-14901: add platform and install name to set to start count of unique values
if (line.record["SAP_Platform__c"]) {
platforms.add(line.record["SAP_Platform__c"]);
}
if (line.record["Install__c"]) {
    console.log('Install__c---->'+line.record["Install__c"]);
installs.add(line.record["Install__c"]);
}
if (line.record["Product_Specific_Terms__c"]) {
tcs.add(line.record["Product_Specific_Terms__c"]);
}

// CR-15602: find all unique legal attribute values and populate on quote
if (line.record["Product_Legal_Attribute__c"]) {
line.record["Product_Legal_Attribute__c"].split(";").forEach( attr => {
if (attr && attr.trim()) legalAttributes.add(attr);
});
}

// CR-17092: find all unique special license types and populate on quote
if (line.record['Special_License_Type_Indicator__c']) {
line.record['Special_License_Type_Indicator__c'].split(';').forEach(attr => {
if (attr && attr.trim()) legalAttributes.add(attr)
})
}
//for CPM make decimal calculation independent of package decimal
if(line.record["SBQQ__ChargeType__c"] == 'Usage'){
if(line.record["Cost_Model__c"] == 'CPM'){
line.record["SBQQ__ProratedListPrice__c"] = line.record["SBQQ__ListPrice__c"];
line.record["SBQQ__ProratedPrice__c"] = line.record["SBQQ__ListPrice__c"];
line.record["SBQQ__RegularPrice__c"] = line.record["SBQQ__ListPrice__c"];
line.record["SBQQ__SpecialPrice__c"] = line.record["SBQQ__ListPrice__c"];
line.record["SBQQ__PartnerPrice__c"] = line.record["SBQQ__ListPrice__c"];
if(line.record["SBQQ__Discount__c"] != null){
line.record["SBQQ__CustomerPrice__c"] = line.record["SBQQ__ListPrice__c"] * (1 - line.record["SBQQ__Discount__c"] / 100);
}else if(line.record["SBQQ__AdditionalDiscountAmount__c"] != null){
line.record["SBQQ__CustomerPrice__c"] = (line.record["SBQQ__ListPrice__c"].toFixed(2) - line.record["SBQQ__AdditionalDiscountAmount__c"]);

}else{
    line.record["SBQQ__CustomerPrice__c"] = line.record["SBQQ__ListPrice__c"];
}
line.record["SBQQ__NetPrice__c"] = line.record["SBQQ__CustomerPrice__c"];
}
}
// get dates for quote lines
var startDate =
line.effectiveStartDate != null
? line.effectiveStartDate
: line.record["SBQQ__EffectiveStartDate__c"];
//CR-027060

// CR 027697 changes added start
let quoteEndDate = quoteModel.record["SBQQ__EndDate__c"] ? new Date(quoteModel.record["SBQQ__EndDate__c"]) : null;
console.log('Quote End Date: ' + quoteEndDate);
// CR 027697 changes added end

var endDate = line.effectiveEndDate != null ? line.effectiveEndDate: line.record["SBQQ__EffectiveEndDate__c"];
var trueTerm = getEffectiveSubscriptionTerm(quoteModel, line);
var trueEndDate = calculateEndDate(startDate, endDate, trueTerm);

// CR 027697 changes added start
if (quoteEndDate && trueEndDate > quoteEndDate) {
trueEndDate = quoteEndDate;
}
// CR 027697 changes added end

if (maxEffectiveEndDate == null || maxEffectiveEndDate < trueEndDate) {
maxEffectiveEndDate = trueEndDate;
}
if (maxEffectiveTerm < trueTerm) {
maxEffectiveTerm = trueTerm;
}
//CR-027296 capturing earliest start date among QL's
if (minEffectiveStartDate == null || minEffectiveStartDate > startDate) {
minEffectiveStartDate = startDate;
}
//CR:022457
//CR:028165
if((line.record["Start_Date_Type__c"] == 'Fixed Start Date')){
line.record["True_Effective_End_Date__c"] = toApexDate(trueEndDate);
}
line.record["True_Effective_Term__c"] = trueTerm;

/* CR-032601 - Added by PH: Backward/Forward Maintenance Date Calculation for Maintenance Renewal quotes */
const lineEndDateStr = line.record["SBQQ__EndDate__c"];
let lineEndDate = null;
if (isMaintRenewal && lineEndDateStr) {
    const lineEndParts = lineEndDateStr.split('-');
    lineEndDate = new Date(Date.UTC(lineEndParts[0], lineEndParts[1] - 1, lineEndParts[2]));
    if (maxLineEndDateAll == null || maxLineEndDateAll < lineEndDate) {
        maxLineEndDateAll = lineEndDate;
    }
}
if (
    isMaintRenewal &&
    quoteModel.record["ERP_Type__c"] === 'Sherpa X'
) {
    const newlineitemstartdate = line.record["SBQQ__StartDate__c"];
    console.log('Start Date=', newlineitemstartdate);
    if (newlineitemstartdate) {
        const startdate = newlineitemstartdate.split('-');
      const newlineitemstartdateafterparse =
    new Date(Date.UTC(startdate[0], startdate[1] - 1, startdate[2]));
       const today = new Date();
    const todayUTC = new Date(Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    ));
    const tomorrowUTC = new Date(todayUTC);
    tomorrowUTC.setUTCDate(todayUTC.getUTCDate() + 1);
    function formatDate(d) {
        return d.getUTCFullYear() + '-' +
            String(d.getUTCMonth() + 1).padStart(2, '0') + '-' +
            String(d.getUTCDate()).padStart(2, '0');
    }
    function addDays(date, days) {
        const d = new Date(date);
        d.setUTCDate(d.getUTCDate() + days);
        return d;
    }
     if (newlineitemstartdateafterparse && newlineitemstartdateafterparse < todayUTC) {

        line.record["Backward_Start_Date__c"] = formatDate(newlineitemstartdateafterparse);
        line.record["Backward_End_Date__c"] = formatDate(todayUTC);

        line.record["Forward_Start_Date__c"] = formatDate(addDays(todayUTC,1));
        line.record["Forward_End_Date__c"] = formatDate(lineEndDate);
        
        
    } else {
        line.record["Backward_Start_Date__c"] = null;
        line.record["Backward_End_Date__c"] = null;
        line.record["Forward_Start_Date__c"] = formatDate(newlineitemstartdateafterparse);
        line.record["Forward_End_Date__c"] = formatDate(lineEndDate);
    }
    
    

    }

}
else if(isMaintRenewal && quoteExpirationDate && expEndOfMonthStr) {
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
if(quoteModel.record["Sub_Type__c"] != "Maintenance Renewal" && line.record.PRMES_Product_Type__c === 'LM' && line.record.CPQ_License_Type__c && extendLicenseTypes.has(line.record.CPQ_License_Type__c.toUpperCase())){
    line.record.SBQQ__SubscriptionTerm__c = 1;
    if(line.record.Id){
        extendLines.add(line.record.Id);
    }
}
if(quoteModel.record["Sub_Type__c"] != "Maintenance Renewal" && line.record.SBQQ__Source__c && line.record.PRMES_Product_Type__c === 'LM' && line.record.CPQ_License_Type__c && maintLicenseTypes.has(line.record.CPQ_License_Type__c.toUpperCase())){
    if(!sourceToClonedMap.has(line.record.SBQQ__Source__c)){
        sourceToClonedMap.set(line.record.SBQQ__Source__c, new Set());
    }
    sourceToClonedMap.get(line.record.SBQQ__Source__c).add(line);
}
});

quoteModel.record["True_Effective_End_Date__c"] =
toApexDate(maxEffectiveEndDate);
quoteModel.record["True_Effective_Term__c"] = maxEffectiveTerm;
//CR-038047
if (isMaintRenewal && maxLineEndDate != null) {
        quoteModel.record["SBQQ__EndDate__c"] = toApexDate(maxLineEndDate);
 }
        if (isMaintRenewal && !quoteModel.record["SBQQ__EndDate__c"] && maxLineEndDateAll != null) {
        quoteModel.record["SBQQ__EndDate__c"] = toApexDate(maxLineEndDateAll);
        }

}

// CR-14901: populate fields with # of unique values
quoteModel.record["Number_Platforms__c"] = platforms.size;
quoteModel.record["Number_Installs__c"] = installs.size;
quoteModel.record["Number_TCs__c"] = tcs.size;

//CR-16244: clm update to stamp the list of unique product specific terms on quote
quoteModel.record["Unique_Product_Terms__c"] = [...tcs].join(',');

// CR-15602: find all unique legal attribute values and populate on quote
// copy values from set to list and join to comma delimited string, field will now have unique legal attributes and unique license types
quoteModel.record['Unique_Supplemental_Terms_Codes__c'] = [...legalAttributes].join(',');

//CR-027296 updating Latest End Date and Subscription Term
quoteModel.record["Latest_End_Date__c"] = toApexDate(maxEffectiveEndDate);
if (maxEffectiveEndDate != null && minEffectiveStartDate != null) {
var eDate = new Date(quoteModel.record["Latest_End_Date__c"]);
eDate.setUTCDate(eDate.getUTCDate() + 1);
quoteModel.record["Total_Subscription_Term__c"] = monthsBetween(minEffectiveStartDate, eDate);
} else {
quoteModel.record["Total_Subscription_Term__c"] = null;
}

//CR 039708:
var altairAlert = "Alert: Altair and Siemens products cannot be grouped in the same Enterprise Group. Please split these products into separate EGs.";
var EG = new Map();
quoteLineModels.forEach(function(ln) {
    if (ln.record.Entitlement_Group__c) {
        if (!EG.has(ln.record.Entitlement_Group__c)) EG.set(ln.record.Entitlement_Group__c, []);
        EG.get(ln.record.Entitlement_Group__c).push(ln);
    }
});
EG.forEach(function(egLines, egKey) {
    if (egLines.length >= 2) {
        var isAltair = function(ln) {
            return !!(ln.record.ERP_TYPE__c && ln.record.ERP_TYPE__c.split(";").map(function(v) { return v.trim(); }).includes("Altair"));
        };
        var altairCount = egLines.filter(isAltair).length;
        if (altairCount > 0 && altairCount < egLines.length) {
            egLines.forEach(function(ln) {
                var existing = ln.record.Error_Alert__c || "";
                if (existing.indexOf(altairAlert) === -1) {
                    ln.record.Error_Alert__c = existing ? existing + " | " + altairAlert : altairAlert;
                }
            });
        }
    }
});



// stamp original group id on
stampOriginalGroupId(quoteModel, quoteLineModels);

// calculate acv
calculateAcv(quoteModel, quoteLineModels);

// calculate sasp values
//037171
//calculateSasp(quoteModel, quoteLineModels);
await calculateSaspFromApex(quoteModel, quoteLineModels, conn);
//update bundle Total
//Tieckt 027240
calculateBundleTotal(quoteModel,quoteLineModels);
let end = Date.now();
console.log(`duration after calculate: ${(end - start) / 1000} s`);
        
// CR-035269
if(quoteModel.record["Sub_Type__c"] != "Maintenance Renewal"){
    // CR-034854
    const existingQuoteLineSourceByLineId = quoteModel.__existingQuoteLineSourceByLineId || {};
    validateMaintLinesForPerpetual(quoteModel,quoteLineModels, sourceToClonedMap, extendLines, maintLicenseTypes, extendLicenseTypes, existingQuoteLineSourceByLineId);
}
if (quoteModel.__mapInstallToLineError) {
    console.log('LI Error Message: ' + quoteModel.__mapInstallToLineError);
    let mapInstallToLineError = quoteModel.__mapInstallToLineError;
    quoteLineModels.forEach(line => {
        console.log('mapInstallToLineError---->'+JSON.stringify(mapInstallToLineError)+'----'+mapInstallToLineError[line.record["Entitlement_Group__c"]] + '----'+line.record["Entitlement_Group__c"]+'--'+line.record.Entitlement_Group__c );

        if( mapInstallToLineError && mapInstallToLineError[line.record["Entitlement_Group__c"]] ){
            if( line.record["Error_Alert__c"] ){
                line.record["Error_Alert__c"] += ' ' + mapInstallToLineError[line.record["Entitlement_Group__c"]];
            }else{
                line.record["Error_Alert__c"] = mapInstallToLineError[line.record["Entitlement_Group__c"]];
            }
        }
        //line.record["Error_Alert__c"] = (line.record["Error_Alert__c"] || '') + ' ' + quoteModel.__liErrorMessage;
    });
}
// CR-038264
if (quoteModel.__seedingEligibleLines && 
    Object.keys(quoteModel.__seedingEligibleLines).length > 0) {
  const resultMap = quoteModel.__seedingEligibleLines;
  var newError = ' ERROR: Seeding needs its own line, 0$, max 12mths';
  for (let line of quoteLineModels) {
    if (resultMap.hasOwnProperty(line.key)) {
      const isEligible = resultMap[line.key];
      if (isEligible === true ||
          line.record["SBQQ__NetTotal__c"] != 0 ||
           line.record["SBQQ__EffectiveSubscriptionTerm__c"] > 12) {
        if (!line.record.Error_Alert__c) {
          line.record.Error_Alert__c = newError;
        } else if (!line.record.Error_Alert__c.includes(newError)) {
          line.record.Error_Alert__c += ' | ' + newError;
        }
      }
      else{
        line.record.O2O_Attribute__c = false;
        line.record.O2O_Attribute_Value__c = 'Z7';
        line.record.QL_Concatenated_Indicator__c = 'Seeding';
        line.record.Non_Renewable__c = true;
      }
    }
  }
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
console.log('@@@', parent.record["Total_Bundle_Discount__c"]);
}
//CR-021800
if (quoteModel.record["SBQQ__Type__c"] == 'Quote' && quoteModel.record["ERP_Type__c"] != "Sherpa X" ) quoteModel.record["Start_Date_Type__c"] = '';
//CR-039249
if (quoteModel.record["SBQQ__Type__c"] === "Amendment" && quoteModel.record["ERP_Type__c"] != "PO3" ) {
    const currentQuoteLineNetTotal = quoteLineModels.reduce((sum, l) => sum + (l.record["SBQQ__NetTotal__c"] || 0), 0);
    for (let line of quoteLineModels) {
        //CR-040181 --Start Here
        let isTFCProduct = quoteModel.__mapOfSubscriptionTFC && line.record["SBQQ__UpgradedSubscription__c"] && quoteModel.__mapOfSubscriptionTFC.get(line.record["SBQQ__UpgradedSubscription__c"]) === 'Y';
        //CR-040181 --End Here
        if(line.record["Product_Flag__c"] === "On Premise" && line.record["CPQ_License_Type__c"] === "FSUB" ) { 
            console.log('in for loop');
            if(line.record["SBQQ__UpgradedSubscription__c"] != null && line.record["SBQQ__EffectiveQuantity__c"] !== 0 && line.record["SBQQ__Quantity__c"] != 0) {
                let errorMsg = line.record["Error_Alert__c"];
                if(isTFCProduct){
                    line.record["Error_Alert__c"] = errorMsg + " Error: Only Full cancellation is allowed for TFC products.";
                }
                else{
                    line.record["Error_Alert__c"] = errorMsg + " Error: On Prem quantity has been reduced/increased. Quantity reduction/increment is not allowed on Amendment.";
                }
                
            }
            if( line.record["SBQQ__UpgradedSubscription__c"] != null && line.record["SBQQ__EffectiveQuantity__c"] < 0 && line.record["SBQQ__Quantity__c"] === 0 
                && currentQuoteLineNetTotal < 0 && !isTFCProduct){
                        let errorMsg = line.record["Error_Alert__c"];
                        line.record["Error_Alert__c"] = errorMsg + " Error: On Prem is been cancelled. Please add replacement products to compensate.";   
            }//CR-040181 - Exclude TFC products
        }
    } 
}
resolve();
});
}

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

//037171
async function calculateSaspFromApex(quoteModel, quoteLines, conn) {
try {
let payload = {
stage: 'aftercalc',
quoteLineData: quoteLines.map(ql => ({
productCode: ql.record.SBQQ__ProductCode__c,
regularTotal: ql.record.SBQQ__RegularTotal__c,
netTotal: ql.record.SBQQ__NetTotal__c,
customerTotal: ql.record.SBQQ__CustomerTotal__c,
customerPrice: ql.record.SBQQ__CustomerPrice__c,
productFlag: ql.record.Product_Flag__c,
trueterm: ql.record.True_Effective_Term__c,
quantity: ql.record.SBQQ__Quantity__c,
licenseType: ql.record.CPQ_License_Type__c
}))
};

const apexResult = await apexCallout(payload, conn);

if (apexResult && apexResult.fieldsToUpdate) {
Object.entries(apexResult.fieldsToUpdate).forEach(([field, value]) => {
quoteModel.record[field] = value;
});
}

return apexResult;

} catch (error) {
console.error('SASP Apex callout failed:', error);
return null;
}
}

// CR-035269
function validateMaintLinesForPerpetual(quoteModel,quoteLineModels, sourceToClonedMap, extendLines, maintLicenseTypes, extendLicenseTypes, existingQuoteLineSourceByLineId){
    
    var MAINT_ERROR_MESSAGE = ' ERROR: Maintenance license type must be created by Extended automation (no standalone Maintenance lines).'; // CR-037305
    var MAINT_ONLY_ONE_ERROR_MESSAGE = ' ERROR: A perpetual line can have only one maintenance line.';
    var MAINT_ERROR_DATE_RANGE_MESSAGE = ' ERROR: Maintenance period cannot be more than 12 months.';
    var EXTEND_ALERT_MESSAGE = ' ALERT: Click Quick Save to add the maintenance line for this product (initial add only; not after manual maint line deletion).';
    //034854
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

        if(line.record.PRMES_Product_Type__c === 'LM' && line.record.CPQ_License_Type__c && maintLicenseTypes.has(line.record.CPQ_License_Type__c.toUpperCase())){
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
            else if(line.record.SBQQ__Source__c && !extendLines.has(line.record.SBQQ__Source__c)){
                line.record.Error_Alert__c = (line.record.Error_Alert__c || '') + MAINT_ERROR_MESSAGE;
            }
            else if(line.record.SBQQ__Source__c && extendLines.has(line.record.SBQQ__Source__c) ){
                let clonedLines = sourceToClonedMap.get(line.record.SBQQ__Source__c);
                if(clonedLines && clonedLines.size > 1){
                    let flag = false;
                    for(let clonedLine of clonedLines){
                        if(!clonedLine.record.Id){
                            flag = true;
                            clonedLine.record.Error_Alert__c = (clonedLine.record.Error_Alert__c || '') + MAINT_ONLY_ONE_ERROR_MESSAGE;
                        }
                    }
                    if(!flag){
                        line.record.Error_Alert__c = (line.record.Error_Alert__c || '') + MAINT_ONLY_ONE_ERROR_MESSAGE;
                    }
                }
                sourceToClonedMap.delete(line.record.SBQQ__Source__c);
            }
            if(line.record.SBQQ__EffectiveStartDate__c &&
   line.record.True_Effective_End_Date__c){

    let months = monthsBetween(
        new Date(line.record.SBQQ__EffectiveStartDate__c),
        new Date(line.record.True_Effective_End_Date__c)
    );

    // Sherpa X allows exactly 12 months
    if(quoteModel.record.ERP_Type__c === 'Sherpa X'){
        if(months > 12){
            line.record.Error_Alert__c =
                (line.record.Error_Alert__c || '') +
                MAINT_ERROR_DATE_RANGE_MESSAGE;
        }
    } else {
        if(months > 11){
            line.record.Error_Alert__c =
                (line.record.Error_Alert__c || '') +
                MAINT_ERROR_DATE_RANGE_MESSAGE;
        }
    }
  }
  }

        if(line.record.Id && extendLines.has(line.record.Id) && !sourceToClonedMap.has(line.record.Id)){
            line.record.Error_Alert__c = (line.record.Error_Alert__c || '') + EXTEND_ALERT_MESSAGE;
        }
        if(!line.record.Id && line.record.PRMES_Product_Type__c === 'LM' && line.record.CPQ_License_Type__c && extendLicenseTypes.has(line.record.CPQ_License_Type__c.toUpperCase())){
            line.record.Error_Alert__c = (line.record.Error_Alert__c || '') + EXTEND_ALERT_MESSAGE;
        }

        // Rule 4: non-blocking informational alert when PRMES is MO.
        //034854 new changes  //039055
        if (line.record.PRMES_Product_Type__c === 'MO' && licenseType && extendLicenseTypes.has(licenseType)) {
         line.record.Error_Alert__c = (line.record.Error_Alert__c || '') + WARRANTY_INCLUDED_ALERT_MESSAGE;
        }
    });


    // Rule 2 (034854): once a source line is linked to maintenance, keep source license in EXTEND set.
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

/**
* Takes a JS Date object and turns it into a string of the type 'YYYY-MM-DD', which is what Apex is expecting.
* @param {String} start The start date in formatted string for calc
* @param {String} end The end date in formatted string for calc
* @returns {Date} the calculated end date result
*/
function calculateEndDate(start, end, subTerm) {
var sd = new Date(start);
var ed = end ? new Date(end) : null;

if (sd != null && ed == null && subTerm != null) {
ed = sd;
ed.setUTCMonth(ed.getUTCMonth() + subTerm);
ed.setUTCDate(ed.getUTCDate() - 1);
}

return ed;
}

/**
* Determines the subscription term value that should be used to calculate end date
* @param {*} quote quote record
* @param {*} line quote line record
* @returns the effective subscription term for quote line
*/
function getEffectiveSubscriptionTerm(quote, line) {
if (line.record["SBQQ__EffectiveStartDate__c"] != null) {
var sd = new Date(line.record["SBQQ__EffectiveStartDate__c"]);
}
//CR-027060
if (line.effectiveEndDate != null) {
var ed = new Date(line.effectiveEndDate);
}
let podSubscriptionTerm;
        // CR-032469
        if(line.SBQQ__ProductCode__c === 'STAR1003A') {
            podSubscriptionTerm = DEFAULT_TERM_POD;
            console.log('podSubscriptionTerm :' + podSubscriptionTerm);
            return podSubscriptionTerm;
        }

let groupSubscriptionTerm;
if (line.parentGroupKey != null) {
let group = quote.groups.find((group) => line.parentGroupKey === group.key);
groupSubscriptionTerm = group.SubscriptionTerm__c;
}
if(line.parentGroupKey != null && line.group.record["Ramp_Group__c"] && groupSubscriptionTerm != null){
return groupSubscriptionTerm;
} else if (sd != null && ed != null) {
ed.setUTCDate(ed.getUTCDate() + 1);
return monthsBetween(sd, ed);
} else if (line.SubscriptionTerm__c != null) {
return line.SubscriptionTerm__c;
} else if (groupSubscriptionTerm != null) {
return groupSubscriptionTerm;
} else if (quote.SubscriptionTerm__c != null) {
return quote.SubscriptionTerm__c;
} else {
return line.DefaultSubscriptionTerm__c;
}
}

/**
* Takes a JS Date object and turns it into a string of the type 'YYYY-MM-DD', which is what Apex is expecting.
* @param {Date} date The date to be stringified
* @returns {string}
*/
function toApexDate(/*Date*/ date) {
if (date == null) {
return null;
}
// Get the ISO formatted date string.
// This will be formatted: YYYY-MM-DDTHH:mm:ss.sssZ
var dateIso = date.toISOString();

// Replace everything after the T with an empty string
return dateIso.replace(new RegExp("[Tt].*"), "");
}

function monthsBetween(/*Date*/ startDate, /*Date*/ endDate) {
if (startDate != null && endDate != null) {
// If the start date is actually after the end date, reverse the arguments and multiply the result by -1
if (startDate > endDate) {
return -1 * monthsBetween(endDate, startDate);
}
var result = 0;
// Add the difference in years * 12
result += (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12;
// Add the difference in months. Note: If startDate was later in the year than endDate, this value will be
// subtracted.
result += endDate.getUTCMonth() - startDate.getUTCMonth();
return result;
}
return 0;
}

/** Solution for Original Group Id
* Automating Custom Dates for Quote Line Groups
* @param {Object} quoteModel
* @param {Object[]} quoteLineModels
*/
function stampOriginalGroupId(quoteModel, quoteLineModels) {
// Check if we have QL Groups
if (quoteModel.groups.length != 0) {
// On Non-Amendments take Group Id and stamp it to Original Group Id field
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

// Repeat the same for QL Groups as well
quoteModel.groups.forEach((group) => {
group.record["Original_Group_Id__c"] =
quoteModel.record["Name"] + "-" + group.record["SBQQ__Number__c"];
});

// On Amendment Quotes
} else if (quoteModel.record["SBQQ__Type__c"] === "Amendment") {
let ogGroupMap = {};

// Matching Group key with Original Group Id
quoteLineModels.forEach((line) => {
if (line.record["Original_Group_Id__c"] != null) {
ogGroupMap[line.parentGroupKey] = line.record["Original_Group_Id__c"];
}
});

quoteLineModels.forEach((line) => {
// Newly added QLs without existing UpgradedSusbcriptions or UpgradedAsset will have their Original Group Id assigned based on their matching Group Key to Original Group Id
if (
line.parentGroupKey in ogGroupMap &&
!line.record["Original_Group_Id__c"]
) {
line.record["Original_Group_Id__c"] = ogGroupMap[line.parentGroupKey];
}
});

// QL Groups will also receive an Original Group Id based on their QLs
quoteModel.groups.forEach((group) => {
group.record["Original_Group_Id__c"] = ogGroupMap[group.key];
});
}
}
}

/**
* Populate default values on ramp groups created in QLE
* @param {*} quote: quote model to access group information for automatically populating values
*/
function populateRampGroupValues(quote) {
const DEFAULT_TERM = 12;
if (quote.groups.length > 0 && quote.record["SBQQ__LineItemsGrouped__c"]) {
let rampGroupNamePrefix = "Ramp Sub-Term";
let rampGroups = [];

// initialize ramp id and map to keep track of keys to corresponding id
let rampId = 1000;
let rampIdMap = {};

// initialize counter for naming groups that are unramped
let counter = 1;
// iterate over quote's groups to find ramped groups for auto populating data and reseting group values for unramped groups
quote.groups.forEach((group) => {
//025463
// add ramp groups to separate list
if (group.record["Ramp_Group__c"] || group.record["Group_Type__c"] == 'Stage Delivery') {
rampGroups.push(group);
} else {
// if ramp group is unselected, reset group values only after initial change (name contains the rampGroupNamePrefix substring)
if (group.record["Name"].includes(rampGroupNamePrefix)) {
group.record["Name"] = `Group${counter}`;
group.record["SBQQ__StartDate__c"] =
quote.record["SBQQ__StartDate__c"];
group.record["SBQQ__SubscriptionTerm__c"] = null;
group.record["Ramp_Percentage_of_Revenue__c"] = null;

// ensure ramp key is null for unramped group lines
group.lineItems.forEach((line) => {
line.record["Ramp_Key__c"] = null;
line.record["Ramp_Id__c"] = null;
line.record["Ramp_Average_Price__c"] = null;
});
} else if(group.record["Group_Name_Change__c"]){
//CR-029181
group.record["Name"] = "Group" + counter;
group.record["Group_Name_Change__c"] = false;
}
}

// propogate values from quote to groups
group.record["Partner_Account__c"] = quote.record["SBQQ__Partner__c"];
group.record["Sales_Org__c"] = quote.record["Sales_Org__c"];
counter++;
});

let startDate = quote.record["SBQQ__StartDate__c"];

// reset counter for ramp group names
counter = 1;
rampGroups.forEach((group) => {
group.record["SBQQ__StartDate__c"] = startDate;
//CR-029181
if (group.record["Name"] == 'Group' + ("" + counter)) group.record["Name"] = rampGroupNamePrefix + (" " + counter);
group.record["Group_Name_Change__c"] = true;
let endDate = group.record["SBQQ__EndDate__c"];

// set non-renewable = true for all but last ramp group
group.lineItems.forEach((line) => {
// populate ramp key field on quote line to 'group' lines together across all groups - used for ACV calc & Opp Product sync
line.record[
"Ramp_Key__c"
] = `${line.record["SBQQ__Quote__c"]}:${line.record["Install__c"]}:${line.record["SBQQ__ProductCode__c"]}`;

// populate ramp id on quote line with corresponding ramp id, otherwise, populate ramp id map with new ramp key => ramp id and increment id
if (line.record["Ramp_Key__c"] in rampIdMap) {
line.record["Ramp_Id__c"] = rampIdMap[line.record["Ramp_Key__c"]];
} else {
line.record["Ramp_Id__c"] = rampId;
rampIdMap[line.record["Ramp_Key__c"]] = rampId;
rampId++;
}

// all grouped lines are marked non-renewable except for last group
//CR-037169-Venkat- Skip this logic for Sherpa X Amendment Stage Delivery
if (
    quote.record["SBQQ__Type__c"] === "Amendment" &&
    quote.record["ERP_Type__c"] === "Sherpa X" &&
    group.record["Group_Type__c"] === "Stage Delivery"
) {
    console.log('===== Skipping Existing Amendment Logic =====');
} else {
    if (counter < rampGroups.length) {
        line.record["Non_Renewable__c"] = true;
    } else {
        line.record["Non_Renewable__c"] = false;
    }
}
});

// if ramp group's subscription term is null or undefined, set to default term value (1 year)
if (!group.SubscriptionTerm__c) {
group.SubscriptionTerm__c = DEFAULT_TERM;
group.record["SBQQ__SubscriptionTerm__c"] = DEFAULT_TERM;
}

// calculate group end date for ramp
var trueEndDate = calculateEndDate(
startDate,
endDate,
group.SubscriptionTerm__c
);

// on the last group, check the number of months between quote start date and group end date
if (counter === rampGroups.length) {
let numMonths = monthsBetween(
new Date(quote.record["SBQQ__StartDate__c"]),
trueEndDate
);

// if the number of months between quote start and group end exceeds the quote's subscription term, set invalid ramp to true
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

        // Skip groups already processed in rampGroups
        if (
            rampGroups.includes(group)
        ) {
            console.log('Skipping Existing Ramp/Stage Group');
            return;
        }

        if (
            quote.record["SBQQ__EndDate__c"] &&
            group.record["SBQQ__EndDate__c"]
        ) {

            // Quote End Date
            let quoteEndParts =
                quote.record["SBQQ__EndDate__c"].split('-');

            let quoteFinalEndDate = new Date(
                quoteEndParts[0],
                quoteEndParts[1] - 1,
                quoteEndParts[2]
            );

            console.log('Quote Final End Date --> ',
                quote.record["SBQQ__EndDate__c"]);

            // Group End Date
            let groupEndParts =
                group.record["SBQQ__EndDate__c"].split('-');

            let groupEndDate = new Date(
                groupEndParts[0],
                groupEndParts[1] - 1,
                groupEndParts[2]
            );

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


/**
* Calculates ACV for all quote lines
* @param {*} quote: quote model to populate ACV total
* @param {*} quoteLines: quote line models containing required data for calcs
*/
function calculateAcv(quote, quoteLines) {
let rampGroups = [];
let acv = 0.0;
let rampGroupMap = {};
let rampTotal = 0.0;

// sum group totals
quote.groups.forEach((group) => {
if (group.record["Ramp_Group__c"]) {
rampGroups.push(group);
rampTotal += group.NetTotal__c;
}
});

// calculate the percentage of revenue for each ramp group
rampGroups.forEach((group) => {
let percentOfTotal = (group.NetTotal__c / rampTotal) * 100;
group.record["Ramp_Percentage_of_Revenue__c"] = Number(
percentOfTotal.toFixed(2)
);
});

// iterate over lines to sum acv calcs
quoteLines.forEach((quoteLine) => {
// CR-030811 start
// if quote line has a ramp key, it is in ramp group
if (quoteLine.record["Ramp_Key__c"]) {
// initialize data if it doesn't exist and add total and increment number of lines
let rampData = rampGroupMap[quoteLine.record["Ramp_Key__c"]];
if (!rampData) {
rampData = { total: 0.0, numLines: 0 };
}
rampData["numLines"]++;
let currentAcv = quoteLine.record["Current_ACV_12_Mth__c"] || 0;
rampData.total += currentAcv;
rampGroupMap[quoteLine.record["Ramp_Key__c"]] = rampData;

} else {
// if not a ramp line, add Current_ACV_12_Mth__c directly to aggregate ACV total
let currentAcv = quoteLine.record["Current_ACV_12_Mth__c"] || 0;
acv += currentAcv;
}
});
// CR-030811 end

// if there are any ramp lines, process here to find average across all
if (rampGroupMap) {
// calculate average price for each quote line after summing totals in previous for loop
quoteLines.forEach((quoteLine) => {
if (quoteLine.record["Ramp_Key__c"]) {
let rampData = rampGroupMap[quoteLine.record["Ramp_Key__c"]];
quoteLine.record["Ramp_Average_Price__c"] = Number(
(rampData.total / rampData.numLines).toFixed(2)
);
}
});

for (const key in rampGroupMap) {
// find the average acv for grouped lines
let rampData = rampGroupMap[key];
acv += rampData["total"] / rampData["numLines"];
}
}

// stamp final calculation on quote
quote.record["ACV__c"] = acv;
}

/**
* Aggregates SASP category totals and calculates values required for SASP validations
* @param {*} quote: quote model to populate SASP fields
* @param {*} quoteLines: quote line models containing required data for calcs
* Added ProductizedServices category as part of CR-027272
*/
function calculateSasp(quote, quoteLines) {
// set up all variables needed for aggregations and calculations
const Sasp_Categories = {
SAAS: "SaaS",
HSAAS: "HSaaS",
LAAS: "LaaS",
XT: "XT",
ProductizedServices: "ProductizedServices",
//CR-034653, introduced 3 new categories
ExtendedPerpetual: "ExtendedPerpetual",
Maintenance: "Maintenance",
OnPremSub: "OnPremSub"
};

// constants to determine SASP category from product flag and high/low thresholds
const saspCategoriesMap = {
"HSaaS Addon": [Sasp_Categories.HSAAS],
"HSaaS Base": [Sasp_Categories.HSAAS],
"LaaS": [Sasp_Categories.LAAS],
"SaaS - Cflag": [Sasp_Categories.SAAS],
"SaaS - Eflag": [Sasp_Categories.XT],
"SaaS - No Flag": [Sasp_Categories.SAAS],
"SaaS - Xflag": [Sasp_Categories.SAAS],
"SaaS - Dflag": [Sasp_Categories.SAAS],
"SaaS - Zflag": [Sasp_Categories.HSAAS], //025636 //New Changes addedd by Ayushi badkul as part of 028415(SAAS to HSAAS)
"SaaS - Tflag": [Sasp_Categories.HSAAS], //CR-034365
//CR-027272
"Consulting": [Sasp_Categories.ProductizedServices],
"Service Fee": [Sasp_Categories.ProductizedServices]
};

// map to store all aggregated totals required for SASP calculations
let categoryTotals = {};

//CR-022019 excluded SAASOPS product from SASP calculation,
//This CR will be deployed under CR-21252
//Include SAASOPS in the NetXT calculation CR-026731
const includedProductCodes = new Set([
"SAASOPS7000",
"SAASOPS7001"
]);
let rampKeyArr = [];
// iterate over quote line to populate SASP category aggregates
quoteLines.forEach((ql) => {
// get the SASP category based on product's product flag
let saspCategory;
let productCode = ql.record["SBQQ__ProductCode__c"];
const licenseType = ql.record["CPQ_License_Type__c"]; //CR-034653
if(includedProductCodes.has(productCode)){
saspCategory = "XT";
}
//CR-034653, categroizing ql based on License Type
else if (["EXTEND","TEST","BKUP","N/A"].includes(licenseType)) {
saspCategory = "ExtendedPerpetual";
} else if (["MAINT","TESTM","BKUPM"].includes(licenseType)) {
saspCategory = "Maintenance";
} else if (ql.record["Product_Flag__c"]) {
if (ql.record["Product_Flag__c"] === 'On Premise' && ["S TEST","S BKUP","FSUB"].includes(licenseType)) {
saspCategory = "OnPremSub";
} else {
saspCategory = saspCategoriesMap[ql.record["Product_Flag__c"]];
}//CR-034653 changes end
} else {
saspCategory = Sasp_Categories.SAAS;
}

// if sasp category has not yet been added, populate defaults for aggregations & calculations
if (saspCategory) {
if (!(saspCategory in categoryTotals)) {
categoryTotals[saspCategory] = {
total: 0, // partner price total
netTotal: 0, // net total
discount: 0, // total amount discounted in $
discountPct: 0, // total discount % for category
potReallocation: 0, // Carrying the potential reallocation amount CR-21252
reallocation: 0, // total amount for re-allocation if needed
allocationPct: 0, // percentage of category total (SaaS|Laas / (SaaS + Laas) or HSaaS|XT / (HSaaS + XT))
term: 0,
totalRampKey:0
};
}

// if ((saspCategory in categoryTotals)) {
console.log(ql.record['Ramp_Key__c']);
if(ql.record['Ramp_Key__c']) {
console.log('inside of Ramp Key');
categoryTotals[saspCategory]['term'] += ql.record["True_Effective_Term__c"];

if(Array.isArray(rampKeyArr) ){
if(!rampKeyArr.includes(ql.record['Ramp_Key__c'])) {
console.log('In Ramp Key');
rampKeyArr.push(ql.record['Ramp_Key__c']);
categoryTotals[saspCategory]['totalRampKey'] += 1;

}
}
}
else {
console.log('Not inside of Ramp Key');
categoryTotals[saspCategory]['term'] = ql.record["True_Effective_Term__c"];
}

//CR-027272
if (ql.record['Product_Flag__c'] == 'Service Fee' && quote.record["ERP_Type__c"] != "Sherpa X"){
categoryTotals[saspCategory]["discount"] += ql.NetTotal__c - ql.CustomerTotal__c;
} else {
categoryTotals[saspCategory]["discount"] += ql.RegularTotal__c - ql.CustomerTotal__c;
}

// aggregate quote line totals per SASP category
//SAASOPS products should include for NetTotal XT Calculation - CR -026731
if(includedProductCodes.has(productCode)){
categoryTotals[saspCategory]["netTotal"] += ql.record["SBQQ__CustomerPrice__c"] * ql.record["SBQQ__Quantity__c"] ;
}else{
//CR-027272
if(ql.record['Product_Flag__c'] == 'Service Fee' && quote.record["ERP_Type__c"] != "Sherpa X"){
categoryTotals[saspCategory]["total"] += ql.NetTotal__c;
}else {
categoryTotals[saspCategory]["total"] += ql.RegularTotal__c;
}
categoryTotals[saspCategory]["netTotal"] += ql.NetTotal__c;
}

}
});

let hsaasXtTotal =
(categoryTotals[Sasp_Categories.HSAAS]
? categoryTotals[Sasp_Categories.HSAAS]["total"]
: 0) +
(categoryTotals[Sasp_Categories.XT]
? categoryTotals[Sasp_Categories.XT]["total"]
: 0);
// iterate over category total keys and calculation discount % & allocation percentage
for (const key in categoryTotals) {
// calculate average discount: total discount amount / list total
let currCategory = categoryTotals[key];
currCategory["discountPct"] =
currCategory["total"] > 0
? currCategory["discount"] / currCategory["total"]
: 0;

// calculate the % total for HSaaS + XT for re-allocation calculations
if (key === Sasp_Categories.HSAAS || key === Sasp_Categories.XT) {
currCategory["allocationPct"] = currCategory["total"] / hsaasXtTotal;
}
}

let saspStatus = "";
let overage = calculateSaspOverage(categoryTotals, Sasp_Categories);

// calculate allocation amounts if discounts are exceeded for hsaas or laas categories OR discount for HSaaS and XT are not equal
if (
overage > 0 ||
(categoryTotals[Sasp_Categories.HSAAS] &&
categoryTotals[Sasp_Categories.XT] &&
Math.round(categoryTotals[Sasp_Categories.HSAAS].discountPct * 100) !==
Math.round(categoryTotals[Sasp_Categories.XT].discountPct * 100))
) {

saspStatus = determineSaspStatus(overage, categoryTotals, Sasp_Categories);
}

// populate quote with calculated SASP values
populateSaspTotalsOnQuote(quote, saspStatus, categoryTotals);
}

/*
* Calculate SASP overage and ReAllocation
* @param {*} categoryTotals: categoryTotals map containing quoteline fields used for SASP calculations
* @param {*} Sasp_Categories: Constant map of type of product family
* CR-021252 : Calculate reallocation amount if required for different categories of product
* CR-027272 : Updated threshold values for SAAS, LAAS & ProductizedServices
*/
function calculateSaspOverage(categoryTotals, Sasp_Categories) {
const categoryThresholds = {
[Sasp_Categories.SAAS]: { low: 0.33, high: 0.165 },
[Sasp_Categories.LAAS]: { low: 0.33, high: 0.165 },
[Sasp_Categories.ProductizedServices]: { low: 0.33, high: 0.165 }
};

let overage = 0.0;
let lowDiscount;
let medianDiscount;
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

//027272
let potProdcutizedServiceReallocation = 0.0;
let ProdcutizedServiceReallocation = 0;
let prodcutizedServiceReallocationNeeded = 0;
let targetProductizedServicesAmount = 0;
let totalSaasAvailable = 0;
let saasToUse = 0;

if (categoryTotals[Sasp_Categories.SAAS]) {
lowDiscount = categoryTotals[Sasp_Categories.SAAS]["total"] *
categoryThresholds[Sasp_Categories.SAAS]["low"];
medianDiscount = categoryTotals[Sasp_Categories.SAAS]["total"] *
categoryThresholds[Sasp_Categories.SAAS]["high"];

if (categoryTotals[Sasp_Categories.SAAS]["discount"] > lowDiscount) {
targetSaasAmt = categoryTotals[Sasp_Categories.SAAS]["total"] * (1 - categoryThresholds[Sasp_Categories.SAAS]["high"]);
if (targetSaasAmt > 0) {
saasReallocationNeeded = targetSaasAmt - categoryTotals[Sasp_Categories.SAAS]["netTotal"];
totalReallocationNeeded += saasReallocationNeeded;
overage += targetSaasAmt - categoryTotals[Sasp_Categories.SAAS]["netTotal"];
}
}
}

// if LaaS exists calculate the threshold for minimum price & the median discount price
if (categoryTotals[Sasp_Categories.LAAS]) {
lowDiscount = categoryTotals[Sasp_Categories.LAAS]["total"] *
categoryThresholds[Sasp_Categories.LAAS]["low"];
medianDiscount = categoryTotals[Sasp_Categories.LAAS]["total"] *
categoryThresholds[Sasp_Categories.LAAS]["high"];

if (categoryTotals[Sasp_Categories.LAAS]["discount"] > lowDiscount) {
targetLaasAmt = categoryTotals[Sasp_Categories.LAAS]["total"] * (1 - categoryThresholds[Sasp_Categories.LAAS]["high"]);
if (targetLaasAmt > 0){
laasReallocationNeeded = targetLaasAmt - categoryTotals[Sasp_Categories.LAAS]["netTotal"];
totalReallocationNeeded += laasReallocationNeeded;
overage += targetLaasAmt - categoryTotals[Sasp_Categories.LAAS]["netTotal"];
}
}
}

//CR-027272
if (categoryTotals[Sasp_Categories.ProductizedServices]) {
lowDiscount = categoryTotals[Sasp_Categories.ProductizedServices]["total"] *
categoryThresholds[Sasp_Categories.ProductizedServices]["low"];
medianDiscount = categoryTotals[Sasp_Categories.ProductizedServices]["total"] *
categoryThresholds[Sasp_Categories.ProductizedServices]["high"];

if (categoryTotals[Sasp_Categories.ProductizedServices]["discount"] > lowDiscount) {
targetProductizedServicesAmount = categoryTotals[Sasp_Categories.ProductizedServices]["total"] * (1 - categoryThresholds[Sasp_Categories.ProductizedServices]["high"]);
if (targetProductizedServicesAmount > 0){
prodcutizedServiceReallocationNeeded = targetProductizedServicesAmount - categoryTotals[Sasp_Categories.ProductizedServices]["netTotal"];
totalReallocationNeeded += prodcutizedServiceReallocationNeeded;
overage += targetProductizedServicesAmount - categoryTotals[Sasp_Categories.ProductizedServices]["netTotal"];
}
}
}

if(totalReallocationNeeded > 0){
if(categoryTotals[Sasp_Categories.SAAS])
categoryTotals[Sasp_Categories.SAAS]["allocationPct"] = saasReallocationNeeded > 0 ? saasReallocationNeeded/totalReallocationNeeded : 0;
if(categoryTotals[Sasp_Categories.LAAS])
categoryTotals[Sasp_Categories.LAAS]["allocationPct"] = laasReallocationNeeded > 0 ? laasReallocationNeeded/totalReallocationNeeded : 0;
//CR-027272
if(categoryTotals[Sasp_Categories.ProductizedServices])
categoryTotals[Sasp_Categories.ProductizedServices]["allocationPct"] = prodcutizedServiceReallocationNeeded > 0 ? prodcutizedServiceReallocationNeeded/totalReallocationNeeded : 0;
}

if(categoryTotals[Sasp_Categories.LAAS]){
if(targetLaasAmt > 0){
potLaasReallocation = 0;
}
else{
potLaasReallocation = categoryTotals[Sasp_Categories.LAAS]["netTotal"] - (categoryTotals[Sasp_Categories.LAAS]["total"] * (1-categoryThresholds[Sasp_Categories.LAAS]["low"]));
categoryTotals[Sasp_Categories.LAAS]["potReallocation"] = potLaasReallocation;
totalPotential += potLaasReallocation;
totalSaasAvailable += potLaasReallocation; //CR-027272
}
}

if(categoryTotals[Sasp_Categories.SAAS]){
if(targetSaasAmt > 0){
potSaasReallocation = 0;
}
else{
potSaasReallocation = categoryTotals[Sasp_Categories.SAAS]["netTotal"] - (categoryTotals[Sasp_Categories.SAAS]["total"] * (1-categoryThresholds[Sasp_Categories.SAAS]["low"]));
categoryTotals[Sasp_Categories.SAAS]["potReallocation"] = potSaasReallocation;
totalPotential += potSaasReallocation;
totalSaasAvailable += potSaasReallocation; //CR-027272
}
}

//027272
if(categoryTotals[Sasp_Categories.ProductizedServices]){
if(targetProductizedServicesAmount > 0){
potProdcutizedServiceReallocation = 0
} else {
potProdcutizedServiceReallocation = categoryTotals[Sasp_Categories.ProductizedServices]["netTotal"] - (categoryTotals[Sasp_Categories.ProductizedServices]["total"] * (1-categoryThresholds[Sasp_Categories.ProductizedServices]["low"]));
categoryTotals[Sasp_Categories.ProductizedServices]["potReallocation"] = potProdcutizedServiceReallocation;
totalPotential += potProdcutizedServiceReallocation;
totalSaasAvailable += potProdcutizedServiceReallocation;
}
}

//Calculate HSaas potential reallocation and reallocatted amount
if (categoryTotals[Sasp_Categories.HSAAS]) {
potHsaasReallocation = categoryTotals[Sasp_Categories.HSAAS]["netTotal"];
categoryTotals[Sasp_Categories.HSAAS]["potReallocation"] = potHsaasReallocation;
totalNonSaas += potHsaasReallocation;
totalPotential += potHsaasReallocation;
}

//Calculate XT potential reallocation and reallocatted amount
if (categoryTotals[Sasp_Categories.XT]) {
potXTReallocation = categoryTotals[Sasp_Categories.XT]["netTotal"];
categoryTotals[Sasp_Categories.XT]["potReallocation"] = potXTReallocation;
totalNonSaas += potXTReallocation;
totalPotential += potXTReallocation;

if(totalNonSaas < totalReallocationNeeded){
xtReallocation = -potXTReallocation;
categoryTotals[Sasp_Categories.XT]["reallocation"] = xtReallocation;
}
else{
xtReallocation = -1 * ((potXTReallocation/totalNonSaas) * totalReallocationNeeded);
categoryTotals[Sasp_Categories.XT]["reallocation"] = xtReallocation;
}
}

if (categoryTotals[Sasp_Categories.HSAAS]) {
if(totalNonSaas < totalReallocationNeeded){
hsaasReallocation = -potHsaasReallocation;
categoryTotals[Sasp_Categories.HSAAS]["reallocation"] = hsaasReallocation;
}
else{
hsaasReallocation = -1 * ((potHsaasReallocation/totalNonSaas) * totalReallocationNeeded);
categoryTotals[Sasp_Categories.HSAAS]["reallocation"] = hsaasReallocation;
}
}

//CR-027272
if (totalNonSaas <= totalReallocationNeeded){
if (totalSaasAvailable > (totalReallocationNeeded - totalNonSaas)){
saasToUse = (totalReallocationNeeded - totalNonSaas);
} else {
saasToUse = totalSaasAvailable;
}
}

if(categoryTotals[Sasp_Categories.LAAS]){
if(laasReallocationNeeded > 0){
if(totalPotential < totalReallocationNeeded){
laasReallocation = categoryTotals[Sasp_Categories.LAAS].allocationPct * totalPotential;
categoryTotals[Sasp_Categories.LAAS]["reallocation"] = laasReallocation;
}else{
laasReallocation = laasReallocationNeeded;
categoryTotals[Sasp_Categories.LAAS]["reallocation"] = laasReallocation;
}
}else{
if(potLaasReallocation > 0 && totalNonSaas <= totalReallocationNeeded){
//Modified as part of CR-027272
laasReallocation = -((potLaasReallocation/totalSaasAvailable)*saasToUse);
categoryTotals[Sasp_Categories.LAAS]["reallocation"] = laasReallocation;
}
else{
laasReallocation = 0;
categoryTotals[Sasp_Categories.LAAS]["reallocation"] = laasReallocation;
}
}
}

//CR-27272
if(categoryTotals[Sasp_Categories.ProductizedServices]){
if(prodcutizedServiceReallocationNeeded > 0){
if(totalPotential < totalReallocationNeeded){
ProdcutizedServiceReallocation = categoryTotals[Sasp_Categories.ProductizedServices].allocationPct * totalPotential;
categoryTotals[Sasp_Categories.ProductizedServices]["reallocation"] = ProdcutizedServiceReallocation;
}else{
ProdcutizedServiceReallocation = prodcutizedServiceReallocationNeeded;
categoryTotals[Sasp_Categories.ProductizedServices]["reallocation"] = ProdcutizedServiceReallocation;
}
}else{
if(potProdcutizedServiceReallocation > 0 && totalNonSaas <= totalReallocationNeeded){
ProdcutizedServiceReallocation = -((potProdcutizedServiceReallocation/totalSaasAvailable)*saasToUse);
categoryTotals[Sasp_Categories.ProductizedServices]["reallocation"] = ProdcutizedServiceReallocation;
}
else{
ProdcutizedServiceReallocation = 0;
categoryTotals[Sasp_Categories.ProductizedServices]["reallocation"] = ProdcutizedServiceReallocation;
}
}
}

if(categoryTotals[Sasp_Categories.SAAS] ){
if(saasReallocationNeeded > 0){
if(totalPotential < totalReallocationNeeded){
saasReallocation = categoryTotals[Sasp_Categories.SAAS].allocationPct * totalPotential;
categoryTotals[Sasp_Categories.SAAS]["reallocation"] = saasReallocation;
}else{
saasReallocation = saasReallocationNeeded;
categoryTotals[Sasp_Categories.SAAS]["reallocation"] = saasReallocation;
}
}else{
if(potSaasReallocation > 0 && totalNonSaas <= totalReallocationNeeded){
//Modified as part of CR-027272
saasReallocation = -((potSaasReallocation /totalSaasAvailable)*saasToUse);
categoryTotals[Sasp_Categories.SAAS]["reallocation"] = saasReallocation;
}
else{
saasReallocation = 0;
categoryTotals[Sasp_Categories.SAAS]["reallocation"] = saasReallocation;
}
}
}

return overage;
}


/*
* Determines the required SASP status value to populate on Quote based on SASP calculations
* @param {*} overage: Total reallocation amount required
* @param {*} categoryTotals: categoryTotals map used for SASP calculations

* @returns
*/
function determineSaspStatus(overage, categoryTotals, Sasp_Categories) {
let saspStatus;

// if total # of sasp categories is 1, only single SASP violation exists
// CR-022022: Wrong status as categoryTotals.length not working
if (overage > 0 && Object.keys(categoryTotals).length === 1) {
saspStatus = "Single PoB SASP violation";


} else if (
overage > 0 &&
!categoryTotals[Sasp_Categories.HSAAS] &&
!categoryTotals[Sasp_Categories.XT]
) {
saspStatus = "Multi PoB SASP violations";
} else {
// check if xt
let discountsEqualized = true;
if (
categoryTotals[Sasp_Categories.HSAAS] &&
categoryTotals[Sasp_Categories.XT] &&
Math.round(categoryTotals[Sasp_Categories.HSAAS]["discountPct"] * 100) !==
Math.round(categoryTotals[Sasp_Categories.XT]["discountPct"] * 100)
) {
discountsEqualized = false;
}

// set status for multi sasp violation with potential reallocation
if (discountsEqualized) {
saspStatus = "Multi PoB SASP violations, potential SASP reallocation";

// set status for multi sasp violation with both potential reallocation and equalization needed
} else {
// if there is no overage, only potential discount equalization & reallocation is needed with no violations
if (overage === 0) {
saspStatus = "Potential discount equalization";
}
// if the total reallocation for either SaaS or LaaS is equal to the overage, single SASP violation
//CR-027272 added ProductizedServices and updated the code to check value of 'reallocation' instead of 'potReallaocation'
else if (
(categoryTotals[Sasp_Categories.SAAS] &&
categoryTotals[Sasp_Categories.SAAS]["reallocation"] == overage) ||
(categoryTotals[Sasp_Categories.LAAS] &&
categoryTotals[Sasp_Categories.LAAS]["reallocation"] == overage) ||
(categoryTotals[Sasp_Categories.ProductizedServices] &&
categoryTotals[Sasp_Categories.ProductizedServices]["reallocation"] == overage)
) {
saspStatus =
"Single PoB SASP violation, potential discount equalization";

// otherwise multiple SASP violations with both equalization and reallocation
} else {
saspStatus =
"Multi PoB SASP violations, potential SASP reallocation, potential discount equalization";
}
}
}

return saspStatus;
}

/**
* Populate SASP calculated values on Quote
* @param {*} quote: quote model provided by CPQ
* @param {*} saspStatus: determined SASP staus field
* @param {*} categoryTotals: categoryTotals map used for SASP calculations
*/
function populateSaspTotalsOnQuote(quote, saspStatus, categoryTotals) {

// CR-14941 - added term to categoryToFieldMap
// map to enable looping over totals to populate fields dynamically during execution
const categoryToField = {
total: {
SaaS: "SaaS_Total__c",
LaaS: "LaaS_Total__c",
HSaaS: "HSaaS_Total__c",
XT: "XT_Total__c",
ProductizedServices: "Productized_Services_Total__c"
},
netTotal: {
SaaS: "SaaS_Net_Total__c",
LaaS: "LaaS_Net_Total__c",
HSaaS: "HSaaS_Net_Total__c",
XT: "XT_Net_Total__c",
ProductizedServices: "Productized_Services_Net_Total__c",
//CR-034653
ExtendedPerpetual: "Extended_Perpetual_Net_Total__c",
Maintenance: "Maintenance_net_total__c",
OnPremSub: "On_Prem_Subscription_Net_Total__c"
},
discountPct: {
SaaS: "SaaS_Discount__c",
LaaS: "LaaS_Discount__c",
HSaaS: "HSaaS_Discount__c",
XT: "XT_Discount__c",
ProductizedServices: "Productized_Services_Discount__c"
},
potReallocation: {
SaaS: "SaaS_Potential_Reallocation__c",
LaaS: "LaaS_Potential_Reallocation__c",
HSaaS: "HSaaS_Potential_Reallocation__c",
XT: "XT_Potential_Reallocation__c",
ProductizedServices: "Productized_Serv_Potential_Reallocation__c"
},

reallocation: {
SaaS: "Saas_Reallocation_Amount__c",
LaaS: "Laas_Reallocation_Amount__c",
HSaaS: "HSaas_Reallocation_Amount__c",
XT: "XT_Reallocation_Amount__c",
ProductizedServices: "Productized_Services_Reallocation__c"
},
postReallocation: {
SaaS: "SaaS_Post_Reallocation__c",
LaaS: "LaaS_Post_Reallocation__c",
HSaaS: "HSaaS_Post_Reallocation__c",
XT: "XT_Post_Reallocation__c",
ProductizedServices: "Productized_Services_Post_Reallocation__c"
},
term: {
SaaS: "SaaS_Term__c",
LaaS: "LaaS_Term__c",
HSaaS: "HSaaS_Term__c",
XT: "XT_Term__c",
ProductizedServices: "Productized_Services_Term__c"
}
};

// reset quote values to populate with any new values
for (const fieldType in categoryToField) {
for (const key in categoryToField[fieldType]) {
let fieldName = categoryToField[fieldType][key];
quote.record[fieldName] = 0.0;
}
}

// populate values for each relevant SASP category field
for (const fieldType in categoryToField) {
for (const key in categoryTotals) {
if (fieldType === "postReallocation") {
quote.record[categoryToField[fieldType][key]] =
categoryTotals[key]["netTotal"] + categoryTotals[key]["reallocation"];
} else if (fieldType === "discountPct") {
quote.record[categoryToField[fieldType][key]] =
categoryTotals[key][fieldType] * 100;
} else if (fieldType === "term") {
let totalTerm = 0;
if(categoryTotals[key]['totalRampKey'] !== 0){
totalTerm = categoryTotals[key][fieldType] / categoryTotals[key]["totalRampKey"];
}else{
totalTerm = categoryTotals[key][fieldType];
}
quote.record[categoryToField[fieldType][key]] = totalTerm;
} else {
quote.record[categoryToField[fieldType][key]] =
categoryTotals[key][fieldType]; // populate corresponding SASP category totals on quote category fields
}
}
}

// populate SASP Type on quote to indicate required re-allocation/equalization needs
quote.record["SASP_Type__c"] = saspStatus;
}







/**

* Aggregates SASP category totals and calculates values required for SASP validations. Ticket 027240

* @param {*} quote: quote model to populate SASP fields

* @param {*} quoteLines: quote line models containing required data for calcs

*/

function calculateBundleTotal(quote, quoteLines) {

// set up all variables needed for aggregations and calculations

quoteLines.forEach((quoteLine) => {

let adjustment = 0;
let listTotal = 0;

let requiredByQuoteline;

if ( quoteLine.record["SBQQ__ProductCode__c"] == 'SAASOPS7000' && quoteLine.record["SBQQ__RequiredBy__c"] != null) {

listTotal = (quoteLine.record["SBQQ__ListPrice__c"]);

adjustment = quoteLine.record["SBQQ__NetTotal__c"];


requiredByQuoteline = quoteLine.record["SBQQ__RequiredBy__c"];

adjustComponeenttotal(adjustment,listTotal,requiredByQuoteline,quoteLines);

}

});

}

// Ticket Ticket 027240
function adjustComponeenttotal(adjustment,listTotal,requiredByQuoteline,quoteLines){

quoteLines.forEach((quoteLine) => {



if (quoteLine.record["Id"] == requiredByQuoteline) {

quoteLine.record["SBQQ__ComponentTotal__c"] -= adjustment;
quoteLine.record["SBQQ__ComponentTotal__c"] += listTotal;
quoteLine.record["SBQQ__ComponentListTotal__c"] = quoteLine.record["SBQQ__ComponentTotal__c"];


}

});

}