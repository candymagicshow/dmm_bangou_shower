// ==UserScript==
// @name         DMM番号展示
// @namespace    https://github.com/candymagicshow/dmm_bangou_shower
// @version      3.3
// @license      GPL License
// @description  在标题下方展示番号
// @author       candymagic
// @include      https://*.dmm.co.*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dmm.co.jp
// @grant        none
// @run-at       document-end
// @downloadURL https://update.greasyfork.org/scripts/525444/DMM%E7%95%AA%E5%8F%B7%E5%B1%95%E7%A4%BA.user.js
// @updateURL https://update.greasyfork.org/scripts/525444/DMM%E7%95%AA%E5%8F%B7%E5%B1%95%E7%A4%BA.meta.js
// ==/UserScript==

(function() {
    'use strict';

    // 容器样式配置
    const containerStyle = {
        position: 'relative',
        display: 'block',
        marginTop: '4px' // 与标题的间距
    };

    // CID样式配置
    const cidStyle = {
        display:'inline-block',
        color: 'rgb(198, 40, 40)',
        fontSize: '12px',
        fontWeight: '600',
        padding: '4px 8px',
        background: 'rgb(255, 235, 238)',
        borderRadius: '4px',
        border: '1px solid rgb(239, 154, 154)',
        margin: '3px 0px',
        lineHeight: '1.4'
    };

    // CID处理模块
    const processCID = {
        // 通用CID提取
        extract: (url) => {
            const cidMatch = url.match(/\/(?:cid=|cid\/)([^\/?]+)/i);
            return cidMatch ? cidMatch[1] : null;
        },

        // 智能格式化
        format: (rawCID) => {
            const match = rawCID.match(/.*?([a-z]+)(\d+)$/i);
            if (!match) return rawCID;

            const letters = match[1].toUpperCase();
            let numbers = match[2].replace(/^0+/, ''); // 去除前导零

            // 处理全零的特殊情况
            if (numbers === '') numbers = '0';

            // 短编号补零逻辑
            numbers = numbers.padStart(3, '0');
            // 但保留超过3位的长编号
            numbers = numbers.length > 3 ? numbers.replace(/^0+/, '') : numbers;

            return `${letters}-${numbers}`;
        },

        // 创建展示元素
        createElement: (cid) => {
            const badge = document.createElement('div');
            badge.textContent = cid;
            Object.assign(badge.style, cidStyle);
            return badge;
        }
    };

    // 定位插入点
    const findParentContainer = (target) => {
        let parent = target;
        while (parent.parentElement) {
            if (parent.getAttribute('data-e2eid')) {
                return parent.parentElement;
            }
            parent = parent.parentElement;
        }
        return target.closest('.c-item') || target.parentElement;
    };

    // 主处理逻辑
    const processTitles = () => {
        document.querySelectorAll('a[href*="/cid="]:not([data-cid-v3])').forEach(link => {
            // 如果链接包含data-e2eid="title"，则跳过该链接
            if (link.hasAttribute('data-e2eid') && link.getAttribute('data-e2eid') === 'title') {
                return;
            }

            const rawCID = processCID.extract(link.href);
            if (!rawCID) return;

            // 格式化CID
            const formattedCID = processCID.format(rawCID);

            // 获取商品项父容器
            const container = findParentContainer(link);

            // 创建专用容器
            const cidElement = processCID.createElement(formattedCID);

            // 插入到商品容器末尾
            container.appendChild(cidElement);

            // 修改所有.product-items_package元素的高度样式
            const packageElements = document.querySelectorAll('.product-items_package');
            packageElements.forEach(packageElement => {
                //添加 height: 400px
                packageElement.style.height = '400px';
            });

            // 标记处理状态
            link.dataset.cidV3 = 'processed';
        });
    };

    // DOM监听优化
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                requestAnimationFrame(processTitles);
            }
        });
    });

    observer.observe(document, {
        childList: true,
        subtree: true,
        attributes: false
    });

    // 初始化执行
    processTitles();
})();
