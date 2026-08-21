'use strict'

export function calculateEndDate(start, end, subTerm) {
    var sd = new Date(start);
    var ed = end ? new Date(end) : null;
    if (sd != null && ed == null && subTerm != null) {
        ed = sd;
        ed.setUTCMonth(ed.getUTCMonth() + subTerm);
        ed.setUTCDate(ed.getUTCDate() - 1);
    }
    return ed;
}

export function getEffectiveSubscriptionTerm(quote, line) {
    if (line.record["SBQQ__EffectiveStartDate__c"] != null) {
        var sd = new Date(line.record["SBQQ__EffectiveStartDate__c"]);
    }
    if (line.effectiveEndDate != null) {
        var ed = new Date(line.effectiveEndDate);
    }

    let groupSubscriptionTerm;
    if (line.parentGroupKey != null) {
        let group = quote.groups.find((group) => line.parentGroupKey === group.key);
        groupSubscriptionTerm = group.SubscriptionTerm__c;
    }

    if (line.parentGroupKey != null && line.group.record["Ramp_Group__c"] && groupSubscriptionTerm != null) {
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

export function toApexDate(date) {
    if (date == null) {
        return null;
    }
    var dateIso = date.toISOString();
    return dateIso.replace(new RegExp("[Tt].*"), "");
}

export function monthsBetween(startDate, endDate) {
    if (startDate != null && endDate != null) {
        if (startDate > endDate) {
            return -1 * monthsBetween(endDate, startDate);
        }
        var result = 0;
        result += (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12;
        result += endDate.getUTCMonth() - startDate.getUTCMonth();
        return result;
    }
    return 0;
}
