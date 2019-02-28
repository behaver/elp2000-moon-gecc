'use strict';

const { JDateRepository } = require('@behaver/jdate');

/**
 * ELP2000Calculator
 *
 * 基于 ELP2000 理论的月球位置计算组件
 * 
 * @author 董 三碗 <qianxing@yeah.net>
 * @version 1.0.0
 */
class ELP2000Calculator {

  /**
   * 构造函数
   * 
   * @param {JDateRepository} jdr JDateRepository 对象
   */
  constructor(jdr) {
    this.private = {};
    this.jdr = jdr;
  }

  /**
   * 设置 JDateRepository 对象
   * 
   * @param {JDateRepository} jdr JDateRepository 对象
   */
  set jdr(jdr) {
    if (!(jdr instanceof JDateRepository)) throw Error('The param jdr should be a instance of JDateRepository.');

    this.private.jdr = jdr;
  }

  /**
   * 获取 JDateRepository 对象
   * 
   * @return {JDateRepository} JDateRepository 对象
   */
  get jdr() {
    return this.private.jdr;
  }

  /**
   * 计算 ELP2000 数据
   * 
   * @param  {Array}  dataArray  数据数组
   * @param  {Array}  tNumsArray 计算截断值数组
   * @return {Number}            计算结果数值
   */
  calc(dataArray, tNumsArray) {

    // 参数检验
    if (!(dataArray instanceof Array)) throw Error('The param dataArray should be an Array.');

    if (!(tNumsArray instanceof Array) && tNumsArray != undefined) throw Error('The param tNumsArray should be an Array.');

    let jdr = this.private.jdr;
    let res = 0;
    let t1 = jdr.JDEC,
        t2 = jdr.JDECP(2) / 1e4,
        t3 = jdr.JDECP(3) / 1e8,
        t4 = jdr.JDECP(4) / 1e8;

    for (var i = 0; i < dataArray.length; i++) {
      let sum = 0;
      let tNum = 
        tNumsArray != undefined && tNumsArray[i] != undefined 
        ? Math.min(tNumsArray[i], dataArray[i].length)
        : dataArray[i].length;
        
      for (var j = 0; j < tNum; j++) {
        let A = dataArray[i][j][1] 
          + dataArray[i][j][2] * t1
          + dataArray[i][j][3] * t2
          + dataArray[i][j][4] * t3
          + dataArray[i][j][5] * t4;

        sum += dataArray[i][j][0] * Math.cos(A);
      }

      res += sum * jdr.JDECP(i);
    }

    return res;
  }

  /**
   * 估算最大误差
   * 
   * @param  {Array}  dataArray  数据数组
   * @param  {Array}  tNumsArray 计算截断值数组
   * @return {Number}            误差数值
   */
  estimateMaxError(dataArray, tNumsArray) {
    // 参数检验
    if (!(dataArray instanceof Array)) throw Error('The param dataArray should be an Array.');

    if (!(tNumsArray instanceof Array) && tNumsArray != undefined) throw Error('The param tNumsArray should be an Array.');

    let jdr = this.private.jdr;
    let accuracy = 0;

    for (var i = 0; i < dataArray.length; i++) {
      let n = 
        tNumsArray != undefined && tNumsArray[i] != undefined 
        ? Math.min(tNumsArray[i], dataArray[i].length)
        : dataArray[i].length;
      if (!n) continue;
      let A = dataArray[i][n-1][0];
      accuracy += Math.sqrt(n) * A * jdr.JDECP(i);
    }

    return 2 * accuracy;
  }

  /**
   * 生成允许最大误差下的瞬时截断值数组
   *
   * 根据由 Bretagnon 和 Francou 提出的误差公式：η * sqrt(n) * A 计算得出。
   * 
   * @param  {Array}  dataArray    数据数组
   * @param  {Number} maximumError 允许最大误差值
   * @return {Array}               截断值数组
   */
  makeTruncationNums(dataArray, maximumError) {
    // 参数检验
    if (!(dataArray instanceof Array)) throw Error('The param dataArray should be an Array.');
    if (typeof(maximumError) !== 'number') throw Error('The param maximumError should be a Number');
    else if (maximumError < 0) throw Error('The param maximumError should be greater than 0.');

    let jdr = this.private.jdr;
    let accuracy = 0;
    let accuracysSum = 0;

    // 截断值数组
    let tNumsArray = [];

    // 新值缩减幅度记录数组
    let reductionsArray = [];

    // 误差记录数组
    let accuracysArray = [];

    for (var k = 0; k < dataArray.length; k++) {
      tNumsArray[k] = reductionsArray[k] = accuracysArray[k] = 0;
    }

    let i = 0;
    let T = dataArray.length;
    let item = 0;

    while(1) {
      if (i < T) item = i % T;
      if (i === T) {
        item = 0;
        tNumsArray[0] ++;
      }

      let nextItem = 0;

      // 更新新端点值
      let tNum = tNumsArray[item] + 1;

      // 计算最大精度值
      if (dataArray[item][tNum - 1] === undefined) {
        reductionsArray[item] = 0;
        tNumsArray[item] --;
        tNum --;
      }

      let A = dataArray[item][tNum - 1][0];
      let accuracy = Math.sqrt(tNum) * A * jdr.JDECP(item);

      if (i < T) accuracysSum += accuracy;

      // 误差缩减值
      let reduction = Math.abs(accuracysArray[item] !== 0 ? accuracysArray[item] - accuracy : accuracy);

      // 记录误差缩减值
      reductionsArray[item] = reduction;

      if (i > T - 1) {

        // 检测并更新最大缩减值
        let maxReduction = 0;
        for (var j = 0; j < T; j++) {
          if (reductionsArray[j] > maxReduction) {
            maxReduction = reductionsArray[j];
            nextItem = j;
          }
        }

        // 更新索引端点
        tNumsArray[nextItem]++;

        // 更新总精度
        accuracysSum -= accuracysArray[item] - accuracy;
      }

      // 记录精度值
      accuracysArray[item] = accuracy;

      // 检查是否达标
      if (i > T && Math.abs(accuracysSum) <= maximumError) {
        // console.warn(accuracysSum, accuracysArray);
        let trueMaxError = this.estimateMaxError(dataArray ,tNumsArray);
        if (trueMaxError > maximumError) {
          maximumError -= ( trueMaxError - maximumError) * 4 / 3;
        }
        // 已达标，跳出缩小精度进程
        break;
      }

      // 无法继续优化精度，强行跳出缩小精度进程
      if (tNumsArray[T - 1] === dataArray[T - 1].length) {
        // console.warn(123);
        break;
      }

      item = nextItem;
      i++;
    }

    return tNumsArray;
  }

  /**
   * 生成允许最大误差下的平均截断值数组
   *
   * 计算公元 -4000 年至公元 6000 年间的平均误差截断数组
   * 
   * @param  {Array}  dataArray    数据数组
   * @param  {Number} maximumError 允许最大误差值
   * @return {Array}               截断值数组
   */
  makeMeanTruncationNums(dataArray, maximumError) {
    let n = 100;
    let t = (3912458 - 260732) / n;
    let jd0 = 260732;
    let sumsArray = [];
    let meanTNumsArray = [];
    
    for (var i = 0; i < n; i++) {
      let jd = jd0 + i * t;
      this.jdr = new JDateRepository(jd);
      let tNumsArray = this.makeTruncationNums(dataArray, maximumError);
      for (var j = 0; j < tNumsArray.length; j++) {
        if (sumsArray[j] === undefined) sumsArray[j] = 0;

        sumsArray[j] += tNumsArray[j];
      }
    }

    for (var i = 0; i < sumsArray.length; i++) {
      meanTNumsArray[i] = Math.ceil(sumsArray[i] / n);
    }

    return meanTNumsArray;
  }

  /**
   * 生成允许最大误差下的安全截断值数组
   *
   * 该方法同时考虑了平均误差和瞬时误差，可以大幅增加截断数组的使用可靠性。
   * 
   * @param  {Array}  dataArray    数据数组
   * @param  {Number} maximumError 允许最大误差值
   * @return {Array}               截断值数组
   */
  makeSafeTruncationNums(dataArray, maximumError) {
    let tNumsArray;
    for (var i = 0; i < 5; i++) {
      tNumsArray = this.makeMeanTruncationNums(dataArray, maximumError);
      let trueMaxError = this.estimateMaxError(dataArray ,tNumsArray);
      if (trueMaxError > maximumError) {
        maximumError = maximumError / 2;
      } else break;
    }

    return tNumsArray;
  }
}

module.exports = ELP2000Calculator;
