# ELP2000Calculator

## 简介

ELP2000Calculator 是基于 ELP2000 数据及算法的运算器，它是组件库的底层核心组件之一，但并不引出给用户使用。

## 用例

```js
const ELP2000Calculator = require('./ELP2000Calculator');
const dataArray = require('../data/l');

let calculator = new ELP2000Calculator(new JDateRepository(2446896));

// 计算 ELP2000 值
let l = calculator.calc(dataArray, [ 27, 15, 8, 4 ]);

// 估算最大误差
let maxError = calculator.estimateMaxError(dataArray, [ 27, 15, 8, 4 ]);

// 生成瞬时截断值数组
let tNumsArray = calculator.makeTruncationNums(dataArray, 0.000001);

// 生成平均截断值数组
let meanTNumsArray = calculator.makeMeanTruncationNums(dataArray, 0.000001);
```

## API

`constructor(jdr)`

构造函数:

* jdr 儒略时间，JDateRepository 对象

`set jdr(jdr)`

设置 JDateRepository 对象

`get jdr()`

获取 JDateRepository 对象

`calc(dataArray, tNumsArray)`

计算 ELP2000 数据:

* dataArray 数据数组
* tNumsArray 计算截断值数组

`estimateMaxError(dataArray, tNumsArray)`

估算最大误差:

* dataArray 数据数组
* tNumsArray 计算截断值数组

`makeTruncationNums(dataArray, maximumError)`

生成允许最大误差下的瞬时截断值数组:

* dataArray 数据数组
* maximumError 允许最大误差值

`makeMeanTruncationNums(dataArray, maximumError)`

生成允许最大误差下的平均截断值数组

* dataArray 数据数组
* maximumError 允许最大误差值

`makeSafeTruncationNums(dataArray, maximumError)`

生成允许最大误差下的安全截断值数组

* dataArray 数据数组
* maximumError 允许最大误差值

## 许可证书

The MIT license.
