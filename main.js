define([
  'troopjs-ef/component/widget',
  '../../config',
  'jquery',
  'lodash',
  'when',
  'template!./main.html',
  'troopjs-browser/loom/config',
  './model'
], function(
  Widget,
  Config,
  $,
  _,
  when,
  template,
  loomConfig,
  model
) {
  'use strict';

  function blurbData(string, data) {
    for (var k in data) {
      string = string.replace('^'+k+'^', data[k]);
    }
    return string;
  }

  function toggleBar(obj, key) {
    var slide = !key ? obj.$element.find('#slide') : $(obj.currentTarget).closest('.progress-status').find('#slide'); //find slide
    if (!slide) {
      return;
    }
    slide['slide' + (key === 'up' ? 'Up' : 'Down')]();//cal anim slideUp, slideDown

    if (!key) {
      return;
    }

    //change button
    var elem = $(obj.currentTarget);
    var prefix = (key === 'up') ? 'down': 'up';
    var blurbId = (key === 'up') ? '639539' : '639540';
    elem.removeClass('slide'+key).addClass('slide' + prefix).find('.text').text(Config.blurb[blurbId]);
  }

  return Widget.extend(function($element) {

  }, {
    'sig/render': function(data) {
      var me = this;

      Config.blurb['639152'] = blurbData(Config.blurb['639152'], _.assign({'curLevel' : data.currentLevelNo, 'targetLevel': data.targetLevelNo}, data));
      me.html(template, _.assign({}, data, Config)).done(function() {
        // render and call toggleBar
        if (!data.isEmpty) { //if all-types are empty i not show up block
          toggleBar(me);
        }
      });

    },

    'sig/start': function() {
      var me = this;
      var data = {};

      me.query('studytarget!current').spread(function(result) {//[1 step] get {params data}
        data = new model.Data(result);

        return me.query('enrollable_courses!current'); //[2 step] get {items} for  GE,BE,IE
      }).spread(function(result) {
        data.groups({groups: result.groups});

        return me.grabDataUnits(data, 0); //[3 step] get {array units for GE}
      }).then(function(result) {
        data.setLevels(_.assign(data, {'levelsGE': result}));

        return me.grabDataUnits(data, 1); //[4 step] get {array units for BE}
        }).then(function(result) {
          data.setLevels(_.assign(data, {'levelsBE': result}));

          return me.grabDataUnits(data, 2); //[5 step] get {array units for IE(INDB2B)}
        }).then(function(result) {
          data.setLevels(_.assign(data, {'levelsIE': result}));

          console.log('DATA', data);
          me.signal('render', data);
        });

    },
    'dom:.slideup/click': function(e) {
      toggleBar(e, 'up');
    },
    'dom:.slidedown/click': function(e) {
      toggleBar(e, 'down');
    },
    'grabDataUnits': function(data, type) {
      var me = this;

      var rows = data[['rowsGE', 'rowsBE', 'rowsIE'][type]];
      var result = data.groups[type];
      var curlvl = data.currentLevelNo;
      var node_id_IND = data.industryEnglishAutoEnrolledUnit;

      var deferred = when.defer();
      var i = 0;
      var arr = [];
      var code = result.groupCode;

      (function rowFn(i) { //each rows

        if (!node_id_IND && (!rows || i >= rows)) { //for all, for node_id_IND possible that (rows == 0)
          return deferred.resolve(arr);
        } else if (curlvl <= 5 && (code === 'BE' || code === 'INDB2B')) { //if current_Level <= 5, not display  BE, IND
          return deferred.resolve(arr);
        }

        var index = (code === 'GE') ? (curlvl + i) : i;
        var node_id = node_id_IND || result.items[index].node_id;
        var obj = {'groupCode': code, 'itemName': result.items[index].itemName, 'node_id': node_id, 'units': []};

        var prefix = (obj.groupCode !== 'BE') ?  obj.groupCode + '_' : '';

        me.query('navigation_units!' + prefix + obj.node_id).then(function(res) {

          console.log('q='+ 'navigation_units!' + obj.groupCode + '_' + obj.node_id, 'RES', res);

          if (Array.isArray(res[0].mergedUnits)) {
            res[0].mergedUnits.map(function(item){
              obj.units.push(Number(item.progressState));
              if (item.progressState === 4) {
                data.curUnit++;
              }
            })
          }

          arr.push(obj);
          if (!node_id_IND) {
            i++;
          } else {
            node_id_IND = 0;
          };
          rowFn(i);
        });

      })(i);

      return deferred.promise;
    }

  });
});
