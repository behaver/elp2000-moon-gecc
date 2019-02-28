# ELP2000MoonGECC

[![GitHub license](https://img.shields.io/badge/license-MIT-brightgreen.svg)](#) [![npm version](https://img.shields.io/npm/v/react.svg?style=flat)](https://www.npmjs.com/package/@behaver/elp2000-moon-gecc) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#)

## 简介

ELP2000MoonGECC 是计算月球的动力学 Date 地心平黄道坐标的组件库，其算法基于 ELP2000 理论。

核心组件 ELP2000 计算器文档，另见：[ELP2000Calculator](./doc/ELP2000Calculator.md)

## 安装

通过 npm 安装，在你的 node 项目目录下执行：

`npm install @behaver/elp2000-moon-gecc`

安装完成后，调用即可：

`const MoonGECC = require('@behaver/elp2000-moon-gecc');`

## 用例

```js
const MoonGECC = require('@behaver/elp2000-moon-gecc');
const { JDateRepository } = require('@behaver/jdate');

let jdr = new JDateRepository(2446896);
let moon = MoonGECC(jdr);

// 获取月球地心黄经度数
let l = moon.l.getDegrees();

// 获取月球地心黄纬度数
let b = moon.b.getDegrees();

// 获取月球地心距离
let r = moon.r;

// 获取月球地心球坐标
let sc = moon.sc;
```

关于计算误差的设置：

```js
const MoonGECC = require('@behaver/elp2000-moon-gecc');
const { JDateRepository } = require('@behaver/jdate');

let jdr = new JDateRepository(2446896);
let moon = MoonGECC(jdr);

// 方法一：调整精度等级
moon.accuracy = 'low';

// 方法二：设置计算截断值数组
moon.setTruncation('b', [ 20, 10, 5, 3 ]);

// 方法三：
// 设置最大误差（瞬时）
moon.setMaxError('r', 5);

// 设置平均最大误差
moon.setMaxError('r', 5, 'mean');

// 设置安全最大误差
moon.setMaxError('r', 5, 'safe');
```

## API

`constructor(jdate)`

构造函数

* jdate 参照儒略时间

`get l()`

获取 月球 Date 地心黄经值

`get b()`

获取 月球 Date 地心黄纬值

`get r()`

获取 月球 Date 地心距离，单位：km

`get sc()`

获取 月球 Date 地心黄道球坐标

`get meanLongitude()`

获取 月球 Date 地心平黄经

`get longitudePerturbationCorrection()`

获取 月球 Date 地心黄经摄动修正

`get longitudePrecessionCorrection()`

获取 月球 Date 地心黄经岁差修正

`get obTime()`

获取观测儒略时间

`set obTime(jdr)`

设定观测儒略时间

* jdr 儒略时间对象

`get accuracy()`

获取计算精度

`set accuracy(level)`

设置计算精度

* levev 包括以下几个等级：low, normal, high, fine, complete。

精度等级和安全最大误差（单位：角秒, km）的对应关系：

* low      5s, 10km 
* normal   2.5s, 5km
* high     1s, 2km
* fine     0.5s, 1km
* complete 0

此处不考虑 ELP2000 数据算法自身误差，实际误差要进行叠加。

`getTruncation(item)`

获取截断值数组

* item 计算项：l、b、r

`setTruncation(item, tNumsArray)`

设置截断值数组

* item 计算项：l、b、r
* tNumsArray 截断值数组

`setMaxError(item, value, mode = 'true')`

设置计算允许最大误差

通过此方法设置运算截断值相较于 `setTruncation(item, tNumsArray)` 和 `set accuracy(level)` 会产生额外的运算量，若为了缩小运算量而使用该方法，则不适于多次调用。

* item 计算项：l、b、r
* value 最大误差数值
* mode 计算模式: true(瞬时误差)、mean(平均误差)、safe(安全误差)

`getMaxError(item)`

获取最大误差

* item 计算项：l、b、r

## 许可证书

The MIT license.
