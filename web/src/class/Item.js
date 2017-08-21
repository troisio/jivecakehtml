export default class Item {
   constructor() {
     this.id = null;
     this.eventId = null;
     this.organizationId = null;
     this.name = null;
     this.description = null;
     this.totalAvailible = null;
     this.maximumPerUser = null;
     this.amount = null;
     this.timeAmounts = null;
     this.countAmounts = null;
     this.status = null;
     this.timeStart = null;
     this.timeEnd = null;
     this.timeUpdated = null;
     this.timeCreated = null;
     this.lastActivity = null;
   }

   getDerivedAmountFromCounts(count) {
     let result = this.amount;

     for (let index = this.countAmounts.length - 1; index > -1; index--) {
       const countAmount = this.countAmounts[index];

       if (count > countAmount.count) {
         result = countAmount.amount;
         break;
       }
     }

     return result;
   }

   getDerivedAmountFromTime(time) {
     let result = this.amount;

     for (let index = this.timeAmounts.length - 1; index > -1; index--) {
       const itemTimeAmount = this.timeAmounts[index];

       if (time > itemTimeAmount.after) {
         result = itemTimeAmount.amount;
         break;
       }
     }

     return result;
   }

   requiresAccountForRegistration() {
     return this.maximumPerUser !== null || this.amount === 0;
   }
 }