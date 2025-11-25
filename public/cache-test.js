// PWA缓存测试脚本
// 在浏览器控制台运行此脚本

console.log('🧪 开始PWA缓存测试...\n');

async function testPWA() {
    const results = {
        serviceWorker: false,
        cacheAPI: false,
        manifest: false,
        offlineReady: false,
        caches: {},
        installable: false
    };

    // 1. 测试Service Worker
    console.log('1. 测试Service Worker...');
    if ('serviceWorker' in navigator) {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            results.serviceWorker = registrations.length > 0;
            console.log(`   ✅ Service Worker支持，找到${registrations.length}个注册`);
            registrations.forEach((reg, i) => {
                console.log(`      - SW${i + 1}: ${reg.scope} (${reg.active ? 'active' : 'inactive'})`);
            });
        } catch (error) {
            console.log(`   ❌ Service Worker测试失败: ${error.message}`);
        }
    } else {
        console.log('   ❌ 浏览器不支持Service Worker');
    }

    // 2. 测试Cache API
    console.log('\n2. 测试Cache API...');
    if ('caches' in window) {
        try {
            const cacheNames = await caches.keys();
            results.cacheAPI = true;
            results.caches = {};
            console.log(`   ✅ Cache API支持，找到${cacheNames.length}个缓存`);
            
            for (const cacheName of cacheNames) {
                const cache = await caches.open(cacheName);
                const requests = await cache.keys();
                results.caches[cacheName] = requests.length;
                console.log(`      - ${cacheName}: ${requests.length} 个项目`);
                
                // 显示前5个项目
                if (requests.length > 0) {
                    console.log('        项目示例:');
                    requests.slice(0, 5).forEach((request, i) => {
                        console.log(`          ${i + 1}. ${request.url}`);
                    });
                    if (requests.length > 5) {
                        console.log(`          ... 还有${requests.length - 5}个项目`);
                    }
                }
            }
        } catch (error) {
            console.log(`   ❌ Cache API测试失败: ${error.message}`);
        }
    } else {
        console.log('   ❌ 浏览器不支持Cache API');
    }

    // 3. 测试Manifest
    console.log('\n3. 测试Web App Manifest...');
    if ('manifest' in document.documentElement) {
        try {
            const manifest = document.querySelector('link[rel="manifest"]');
            if (manifest) {
                results.manifest = true;
                console.log(`   ✅ Manifest找到: ${manifest.href}`);
            } else {
                console.log('   ❌ 未找到Manifest链接');
            }
        } catch (error) {
            console.log(`   ❌ Manifest测试失败: ${error.message}`);
        }
    } else {
        console.log('   ❌ 浏览器不支持Manifest');
    }

    // 4. 测试离线能力
    console.log('\n4. 测试离线能力...');
    if (results.serviceWorker && results.cacheAPI) {
        try {
            // 尝试从缓存获取主页
            const response = await fetch('/', { method: 'GET' });
            if (response.ok || response.type === 'opaque') {
                results.offlineReady = true;
                console.log('   ✅ 离线能力正常');
            } else {
                console.log('   ⚠️  离线能力部分正常');
            }
        } catch (error) {
            console.log(`   ❌ 离线测试失败: ${error.message}`);
        }
    } else {
        console.log('   ❌ 不支持离线功能（缺少Service Worker或Cache API）');
    }

    // 5. 测试安装能力
    console.log('\n5. 测试PWA安装能力...');
    if ('beforeinstallprompt' in window) {
        results.installable = true;
        console.log('   ✅ 支持PWA安装');
    } else {
        console.log('   ❌ 不支持PWA安装提示');
    }

    // 6. 输出测试结果
    console.log('\n🎯 测试结果总结:');
    console.log('='.repeat(50));
    console.log(`Service Worker: ${results.serviceWorker ? '✅ 通过' : '❌ 失败'}`);
    console.log(`Cache API: ${results.cacheAPI ? '✅ 通过' : '❌ 失败'}`);
    console.log(`Web Manifest: ${results.manifest ? '✅ 通过' : '❌ 失败'}`);
    console.log(`离线能力: ${results.offlineReady ? '✅ 通过' : '❌ 失败'}`);
    console.log(`可安装: ${results.installable ? '✅ 通过' : '❌ 失败'}`);
    
    const passedTests = Object.values(results).filter(v => v === true).length;
    const totalTests = Object.keys(results).length - 1; // 排除caches对象
    console.log(`\n总体评分: ${passedTests}/${totalTests} 测试通过`);
    
    if (passedTests === totalTests) {
        console.log('🎉 恭喜！PWA缓存功能完全正常！');
    } else if (passedTests >= 3) {
        console.log('✅ PWA缓存功能基本正常，部分功能需要优化');
    } else {
        console.log('⚠️  PWA缓存功能存在问题，需要检查配置');
    }

    // 7. 提供建议
    console.log('\n💡 建议:');
    if (!results.serviceWorker) {
        console.log('- 检查Service Worker注册是否成功');
        console.log('- 确认SSL证书有效（Service Worker需要HTTPS）');
    }
    if (!results.cacheAPI) {
        console.log('- 检查浏览器是否支持Cache API');
    }
    if (!results.manifest) {
        console.log('- 确认manifest.webmanifest文件存在且链接正确');
    }
    if (!results.offlineReady) {
        console.log('- 尝试刷新页面以触发资源缓存');
        console.log('- 检查Network面板看资源是否被缓存');
    }
    if (!results.installable) {
        console.log('- 某些浏览器不支持安装提示，这是正常的');
    }

    return results;
}

// 运行测试
testPWA().then(results => {
    console.log('\n🔍 详细测试结果:', results);
}).catch(error => {
    console.error('❌ 测试运行出错:', error);
});