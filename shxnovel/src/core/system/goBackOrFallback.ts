import { Router } from '@vaadin/router';

export function goBackOrFallback(fallbackPath = '/') {
    // document.referrer 表示用户是从哪个页面跳过来的
    // 如果 referrer 包含当前域名，说明是应用内跳转，可以安全 back
    if (document.referrer && document.referrer.includes(window.location.origin)) {
        window.history.back();
    } else {
        // 如果没有 referrer (直接输入网址/书签) 或来自外部网站
        // 执行 fallback 跳转 (使用 Router.go 以利用我们之前的 View Transition)
        Router.go(fallbackPath);
    }
}
