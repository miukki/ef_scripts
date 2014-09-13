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

      Config.blurb['639152'] = blurbData(Config.blurb['639152'], _.assign(data, {'curLevel' : data.currentLevelNo, 'targetLevel': data.targetLevelNo}));
      me.html(template, _.assign({}, data, Config)).done(function() {
        // render and call toggleBar
        toggleBar(me);
      });

    },

    'sig/start': function() {
      var me = this;
      var data = {};//clean data

      me.query('studytarget!current').spread(function(result) {//[1 step] get CurLevel, get targetLevelNo, get total units-done

        console.log('RESULT', result);


        data = new model.Data(result);

        return me.query('enrollable_courses!current');

      }).spread(function(result) {

        data = new model.Data(_.assign(data, {groups: result.groups})); //[2 step] get all groups- GE, BE, IE

        return me.grabDataUnits(data.rowsGE, data.groups[0], data.currentLevelNo); //[3 step] get units-GE

      }).then(function(result) {

        data = new model.Data(_.assign(data, {'levelsGE': result}))

        return me.grabDataUnits(data.rowsBE, data.groups[1], data.currentLevelNo); //[4 step] grab data units-BE

        }).then(function(result) {


          data = new model.Data(_.assign(data, {'levelsBE': result}))


          return me.grabDataUnits(data.rowsIE, data.groups[2], data.currentLevelNo, data.industryEnglishAutoEnrolledUnit); //[5 step] grab data units-IE

        }).then(function(result) {


          data = new model.Data(_.assign(data, {'levelsIE': result}))

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
    'grabDataUnits': function(rows, result, curlvl, node_id_IND) {
      var me = this;
      var deferred = when.defer();
      var i = 0;
      var arr = [];
      var code = result.groupCode;

      (function rowFn(i) { //each rows

        if (!node_id_IND && (!rows || i >= rows)) { //for all
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
