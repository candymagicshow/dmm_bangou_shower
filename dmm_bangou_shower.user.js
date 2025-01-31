// ==UserScript==
// @name         DMM番号展示
// @namespace    https://github.com/candymagicshow/dmm_bangou_shower
// @version      2.0
// @description  在标题下方展示格式化后的番号
// @author       candymagic
// @match        https://video.dmm.co.jp/*
// @match        https://www.dmm.co.jp/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dmm.co.jp
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 通用样式配置
    const styleConfig = {
        cidBadge: {
            display: 'inline-block',
            color: '#c62828',
            fontSize: '12px',
            fontWeight: 600,
            padding: '4px 8px',
            background: '#ffebee',
            borderRadius: '4px',
            border: '1px solid #ef9a9a',
            //fontFamily: 'monospace',
            margin: '3px 0',
            lineHeight: 1.4
        }
    };

    // 定位器
    const positionStrategies = {
        // 标准商品列表页
        default: (target) => {
            const container = target.closest('[data-e2eid="product-item"]')
                || target.closest('.c-item');
            return {
                parent: container || target.parentElement,
                insertBefore: target.nextElementSibling
            };
        },

        // 精选页面
        pickup: (target) => {
            const container = target.closest('.pickup-details');
            return {
                parent: container,
                insertBefore: container.querySelector('.tx-sublink, .tx-price')
            };
        }
    };

    // CID处理
    const processCID = {
        // 通用CID提取
        extract: (url) => {
            const cidMatch = url.match(/\/(?:cid=|cid=)([^\/?]+)/i);
            return cidMatch ? cidMatch[1] : null;
        },

        // 智能格式化
        format: (rawCID) => {
            const match = rawCID.match(/^([a-z]+)(\d+)$/i);
            if (!match) return rawCID;

            const letters = match[1].toUpperCase();
            let numbers = match[2].replace(/^0+/, '');

            // 特殊处理短编号
            if (numbers.length < 3) {
                numbers = numbers.padStart(3, '0');
            }

            return `${letters}-${numbers}`;
        },

        // 创建展示元素
        createElement: (cid) => {
            const badge = document.createElement('div');
            badge.textContent = cid;
            Object.assign(badge.style, styleConfig.cidBadge);
            return badge;
        }
    };

    // 多模式处理
    const processMultiLayout = () => {
        // 匹配两种页面结构的选择器
        const selectors = [
            // 标准商品项
            'a[data-e2eid="title"][href*="/cid="]:not([data-cid-processed])',
            // 新版精选项
            '.pickup-details a[href*="/cid="]:not([data-cid-processed])'
        ];

        document.querySelectorAll(selectors.join(',')).forEach(target => {
            const rawCID = processCID.extract(target.href);
            if (!rawCID) return;

            // 判断页面类型
            const pageType = target.closest('.pickup-details') ? 'pickup' : 'default';

            // 获取插入位置
            const strategy = positionStrategies[pageType](target);
            if (!strategy.parent) return;

            // 创建并插入元素
            const cidElement = processCID.createElement(processCID.format(rawCID));
            strategy.parent.insertBefore(cidElement, strategy.insertBefore);

            // 标记已处理
            target.dataset.cidProcessed = true;
        });
    };

    // DOM监听
    const observer = new MutationObserver(mutations => {
        if (mutations.some(m => m.addedNodes.length > 0)) {
            requestAnimationFrame(processMultiLayout);
        }
    });

    observer.observe(document, {
        childList: true,
        subtree: true,
        attributes: false
    });

    // 初始执行
    processMultiLayout();
})();