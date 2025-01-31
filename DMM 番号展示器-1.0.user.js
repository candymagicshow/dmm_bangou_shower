// ==UserScript==
// @name         DMM 番号展示器
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  在标题下方展示格式化后的番号
// @author       candymagic
// @match        https://video.dmm.co.jp/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dmm.co.jp
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 样式配置
    const styleConfig = {
        container: {
            display: 'block',
            margin: '4px 0 8px',
            lineHeight: 1.2
        },
        cidBadge: {
            display: 'inline-block',
            color: '#d32f2f',
            fontSize: '12px',
            fontWeight: 600,
            padding: '4px 8px',
            background: '#ffebee',
            borderRadius: '4px',
            border: '1px solid #ffcdd2',
            //fontFamily: 'monospace',
            letterSpacing: '0.5px'
        }
    };

    // CID提取正则
    const extractCID = url => {
        const cidMatch = url.match(/\/(cid=([^\/]+))/i);
        return cidMatch ? cidMatch[2] : null;
    };

    // CID智能格式化
    const formatCID = rawCID => {
        // 拆解字母数字部分
        const match = rawCID.match(/^([a-z]+)(\d+)$/i);
        if (!match) return rawCID;

        const letters = match[1].toUpperCase();
        const numbers = match[2];
        const numValue = parseInt(numbers, 10);

        // 数字部分处理
        let formattedNumber;
        if (numValue < 100) {
            formattedNumber = numValue.toString().padStart(3, '0'); // 补零
        } else if (numValue >= 100 && numValue < 1000) {
            formattedNumber = numValue.toString(); // 直接显示三位数
        } else {
            formattedNumber = numbers; // 保留原始数字格式
        }

        // 清理前导零（仅限三位数以上）
        if (numValue >= 1000) {
            formattedNumber = numbers.replace(/^0+/, '');
        }

        return `${letters}-${formattedNumber}`;
    };

    // 创建展示元素
    const createCIDElement = cid => {
        const container = document.createElement('div');
        Object.assign(container.style, styleConfig.container);

        const badge = document.createElement('span');
        badge.textContent = formatCID(cid);
        Object.assign(badge.style, styleConfig.cidBadge);

        container.appendChild(badge);
        return container;
    };

    // 智能插入逻辑
    const insertAfterTitle = (titleElement, cidElement) => {
        // 查找最近的公共容器
        const parentContainer = titleElement.closest('[class*="container"]')
            || titleElement.closest('.c-item')
            || titleElement.parentElement;

        // 精确插入到标题元素之后
        if (parentContainer) {
            parentContainer.insertBefore(
                cidElement,
                titleElement.nextElementSibling
            );
        }
    };

    // 主处理流程
    const processTitles = () => {
        const selector = 'a[data-e2eid="title"][href*="/cid="]:not([data-cid-final])';

        document.querySelectorAll(selector).forEach(title => {
            const rawCID = extractCID(title.href);
            if (!rawCID) return;

            const cidElement = createCIDElement(rawCID);
            insertAfterTitle(title, cidElement);

            title.dataset.cidFinal = 'processed';
        });
    };

    // 高性能DOM监听
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                processTitles();
            }
        });
    });

    observer.observe(document, {
        childList: true,
        subtree: true
    });

    // 初始执行
    processTitles();
})();