define(['lodash'], function (_) {

  function Arr(arr) {
    return Array.isArray(arr) ? arr : [];
  }

  function Obj(obj){
    return (obj && ('object' === typeof obj)) ? obj : {};
  }

  function Num(n) {
    return Number(n) || 0;
  }

  function Str(str) {
    return (undefined !== str) ? String(str) : '';
  }

  var Data = function(obj) {
    obj = Obj(obj);

    this.currentLevelNo = Num(obj.currentLevelNo);
    this.targetLevelNo = Num(obj.targetLevelNo);

    this.businessSpinTarget = Num(obj.businessSpinTarget);
    this.generalEnglishTarget = Num(obj.generalEnglishTarget);

    this.industrySpinTarget = Num(obj.industrySpinTarget);
    this.industryEnglishAutoEnrolledUnit = Num(obj.industryEnglishAutoEnrolledUnit); // 2524 <-- for test;

    this.totalUnit = this.businessSpinTarget + this.generalEnglishTarget + this.industrySpinTarget;
    this.curUnit = Num(obj.curUnit);

    var num = Math.abs(this.targetLevelNo - this.currentLevelNo); //points beetween targetLevelNo and currentLevelNo
    this.rowsGE = !num ? num : num + 1; //for array i need it
    this.rowsBE = Math.ceil(this.businessSpinTarget/3); //for array i need it
    this.rowsIE = this.industrySpinTarget; //for array i need it
  }

  Data.prototype.groups = function(obj) {
    obj = Obj(obj);
    this.groups = Arr(obj.groups);
  }

  Data.prototype.setLevels = function(obj) {
    obj = Obj(obj);
    this.levelsGE = Arr(obj.levelsGE);
    this.levelsBE = Arr(obj.levelsBE);
    this.levelsIE = Arr(obj.levelsIE); //this.currentLevelNo > 1 && !(this.industrySpinTarget

    this.isEmpty = !this.levelsGE.length && !this.levelsBE.length && !this.levelsIE.length; // if no data, won't appear bar
  }

  return {
    'Data': Data
  };


});
