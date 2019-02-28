'use strict';

const LData = require('./data/l');
const BData = require('./data/b');
const RData = require('./data/r');
const ELP2000Calculator = require('./src/ELP2000Calculator');
const { JDateRepository, CacheSpaceOnJDate } = require('@behaver/jdate');
const { SphericalCoordinate3D } = require('@behaver/coordinate/3d');
const Angle = require('@behaver/angle');

/**
 * 月球 Date 地心黄经坐标计算组件
 *
 * @author 董 三碗 <qianxing@yeah.net>
 * @version 1.0.0
 */
class ELP2000MoonGECC {

  /**
   * 构造函数
   * 
   * @param {JDateRepository} jdate 参照儒略时间
   */
  constructor(jdate) {

    this.private = {};
    this.private.jdate = jdate;
    this.cache = new CacheSpaceOnJDate(jdate);
    this.calculator = new ELP2000Calculator(jdate);

    this.private.l = {
      data: LData,
    };
    this.private.b = {
      data: BData,
    };
    this.private.r = {
      data: RData,
    };

    this.private.accuracy = 'complete';
  }

  /**
   * 获取 月球 Date 地心黄经值
   * 
   * @return {Angle} 月球地心黄经 角度对象
   */
  get l() {
    if (!this.cache.has('l')) {
      let l = this.meanLongitude.getRadian() 
            + this.longitudePrecessionCorrection.getRadian()
            + this.longitudePerturbationCorrection.getRadian();

      // 对公元 3000 年至公元 5000 年的拟合, 最大误差小于10角秒
      if (this.private.jdate.JDEC > 10) {
        let tx = this.private.jdate.JDEC,
            tx2 = tx * tx;
        l += (new Angle).setSeconds(-0.866 + 1.43 * tx + 0.054 * tx2).getRadian();
      }

      this.cache.set('l', l);
    }

    return new Angle(this.cache.get('l'), 'r');
  }

  /**
   * 获取 月球 Date 地心黄纬值
   * 
   * @return {Angle} 月球地心纬经 角度对象
   */
  get b() {
    if (!this.cache.has('b')) {
      let b = this.calculator.calc(this.private.b.data, this.private.b.truncationNums);
      this.cache.set('b', b);
    }

    return new Angle(this.cache.get('b'), 's');
  }

  /**
   * 获取 月球 Date 地心距离
   *
   * 单位：km
   * 
   * @return {Number} 月球地心距离
   */
  get r() {
    if (!this.cache.has('r')) {
      let r = this.calculator.calc(this.private.r.data, this.private.r.truncationNums);
      this.cache.set('r', r);
    }

    return this.cache.get('r');
  }

  /**
   * 获取 月球 Date 地心黄道球坐标
   * 
   * @return {SphericalCoordinate3D} 月球地心黄道球坐标
   */
  get sc() {
    return new SphericalCoordinate3D(this.r / 1.49597870691e8, Math.PI / 2 - this.b.inRound(-90, 'd').getRadian(), this.l.inRound().getRadian());
  }

  /**
   * 月球 Date 地心平黄经
   * 
   * @return {Angle} 月球平黄经 角度对象
   */
  get meanLongitude() {
    if (!this.cache.has('meanLongitude')) {
      let jdate = this.private.jdate;
      
      // 月球平黄经 单位：弧度
      let ml = 3.81034392032 
        + 8.39968473021E+03 * jdate.JDEC
        - 3.31919929753E-05 * jdate.JDECP(2) 
        + 3.20170955005E-08 * jdate.JDECP(3) 
        - 1.53637455544E-10 * jdate.JDECP(4);

      this.cache.set('meanLongitude', ml);
    }

    return new Angle(this.cache.get('meanLongitude'), 'r');
  }

  /**
   * 获取 月球 Date 地心黄经摄动修正
   * 
   * @return {Angle} 月球地心黄经摄动修正 角度对象
   */
  get longitudePerturbationCorrection() {
    if (!this.cache.has('longitudePerturbationCorrection')) {
      let lpc = this.calculator.calc(this.private.l.data, this.private.l.truncationNums);
      this.cache.set('longitudePerturbationCorrection', lpc);
    }

    return new Angle(this.cache.get('longitudePerturbationCorrection'), 's');
  }

  /**
   * 获取 月球 Date 地心黄经岁差修正
   * 
   * @return {Angle} 月球地心黄经岁差修正 角度对象
   */
  get longitudePrecessionCorrection() {
    if (!this.cache.has('longitudePrecessionCorrection')) {
      let data = [ 5028.792262, 1.1124406, 0.00007699, 0.000023479, 0.0000000178 ];
      let lpc = 0;
      for (var i = 0; i < data.length; i ++) lpc += data[i] * this.private.jdate.JDECP(i + 1);
      this.cache.set('longitudePrecessionCorrection', lpc);
    }

    return new Angle(this.cache.get('longitudePrecessionCorrection'), 's');
  }

  /**
   * 设定观测儒略时间
   * 
   * @param  {JDateRepository} jdr 观测儒略时间
   */
  set obTime(jdr) {
    if (!(jdr instanceof JDateRepository)) throw Error('The param jdr should be a instance of JDateRepository.');

    this.cache.on(jdr);
    this.calculator.jdr = jdr;
    this.private.jdate = jdr;
  }

  /**
   * 获取观测儒略时间
   * 
   * @return {JDateRepository} 观测儒略时间
   */
  get obTime() {
    return this.private.jdate;
  }

  /**
   * 设置截断值数组
   * 
   * @param  {String} item        计算项：l、b、r
   * @param  {Array}  tNumsArray  截断值数组
   * @return {PlanetHECCOnVSOP87} 返回 this 引用
   */
  setTruncation(item, tNumsArray) {
    if (item !== 'l' && item !== 'b' && item !== 'r') throw Error('The param item should be l, b or r');
    if (!(tNumsArray instanceof Array)) throw Error('The param tNumsArray should be an Array.');

    this.private[item].truncationNums = tNumsArray;

    // 清除原始缓存数据
    this.cache.remove(item);

    // 精度级别为自定义
    this.private.accuracy = 'custom';

    return this;
  }

  /**
   * 获取截断值数组
   * 
   * @param  {String} item 计算项：l、b、r
   * @return {Array}       截断值数组
   */
  getTruncation(item) {
    if (item !== 'l' && item !== 'b' && item !== 'r') throw Error('The param item should be l, b or r');

    return this.private[item].truncationNums
  }

  /**
   * 设置计算允许最大误差
   *
   * 通过此方法设置运算截断值相较于 `setTruncation(item, tNumsArray)` 和 `set accuracy(level)` 会产生额外的运算量，若为了缩小运算量而使用该方法，则不适于多次调用。
   * 
   * @param  {String}             item   计算项：l、b、r
   * @param  {Number}             value  最大误差数值
   * @param  {Boolean}            mode   计算模式: true(瞬时误差)、mean(平均误差)、safe(安全误差)
   * @return {PlanetHECCOnVSOP87}        返回 this 引用
   */
  setMaxError(item, value, mode = 'true') {
    if (item !== 'l' && item !== 'b' && item !== 'r') throw Error('The param item should be l, b or r');
    if (typeof(value) !== 'number' || value < 0) throw Error('The param value should be a Number witch is greater than 0.');
    if (typeof(mode) !== 'string') throw Error('The param mode should be a String.');

    switch(mode.toLowerCase()) {
      case 'true':
        this.private[item].truncationNums = this.calculator.makeTruncationNums(this.private[item].data, value);
        break;

      case 'mean':
        this.private[item].truncationNums = this.calculator.makeMeanTruncationNums(this.private[item].data, value);
        break;

      case 'safe':
        this.private[item].truncationNums = this.calculator.makeSafeTruncationNums(this.private[item].data, value);
        break;

      default:
        throw Error('The param mode should be true、mean or safe.');
    }

    // 清除原始缓存数据
    this.cache.remove(item);

    // 精度级别为自定义
    this.private.accuracy = 'custom';

    return this;
  }

  /**
   * 获取最大误差
   * 
   * @param  {String}  item   计算项：l、b、r
   * @return {Number}         最大误差值
   */
  getMaxError(item) {
    if (item !== 'l' && item !== 'b' && item !== 'r') throw Error('The param item should be l, b or r');

    return this.calculator.estimateMaxError(this.private[item].data, this.private[item].truncationNums);
  }

  /**
   * 设置计算精度
   * 
   * @param  {String} level 设置运算精度
   */
  set accuracy(level) {
    switch(level) {
      // 以下注释误差为额外平均误差
      case 'low':
        this.private.l.truncationNums = [ 39, 13, 4, 2 ]; // 5s
        this.private.b.truncationNums = [ 54, 5, 3 ]; // 5s
        this.private.r.truncationNums = [ 46, 12, 4 ]; // 10km
        break;

      case 'normal':
        this.private.l.truncationNums = [ 44, 13, 4, 2 ]; // 2.5s
        this.private.b.truncationNums = [ 65, 8, 9 ]; // 2.5s
        this.private.r.truncationNums = [ 62, 21, 8 ] // 5km
        break;

      case 'high':
        this.private.l.truncationNums = [ 51, 13, 4, 2 ]; // 1s
        this.private.b.truncationNums = [ 69, 8, 12 ]; // 1s
        this.private.r.truncationNums = [ 77, 38, 11 ] // 2km
        break;

      case 'fine':
        this.private.l.truncationNums = [ 62, 13, 4, 2 ]; // 0.5s
        this.private.b.truncationNums = [ 74, 8, 12 ]; // 0.5s
        this.private.r.truncationNums = [ 87, 39, 11 ]; // 1km
        break;

      case 'complete':
        break;

      default:
        throw Error('The param level was illegal.');
    }
    
    if (level !== this.private.accuracy) {
      
      // 清除原始缓存数据
      this.cache.clear();

      this.private.accuracy = level;
    }
  }

  /**
   * 获取计算精度
   * 
   * @return {String} 计算精度设置
   */
  get accuracy() {
    return this.private.accuracy;
  }
}

module.exports = ELP2000MoonGECC;
