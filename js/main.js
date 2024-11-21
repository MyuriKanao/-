class KoiPond {
    constructor() {
        this.wishCount = parseInt(localStorage.getItem('wishCount')) || 0;
        this.wishes = JSON.parse(localStorage.getItem('wishes')) || [];
        this.setupElements();
        this.initializeEvents();
        this.createBackgroundKoi();
        this.setupBackgroundMusic();
    }

    setupElements() {
        this.button = document.getElementById('wishButton');
        this.shareButton = document.getElementById('shareButton');
        this.countDisplay = document.getElementById('wishCount');
        this.koiContainer = document.querySelector('.koi-container');
        this.splashSound = document.getElementById('splashSound');
        this.wishInput = document.getElementById('wishText');
        this.wishsList = document.getElementById('recentWishes');
        this.backgroundMusic = document.getElementById('backgroundMusic');
        
        this.updateWishCount();
        this.displayRecentWishes();
    }

    setupBackgroundMusic() {
        document.addEventListener('click', () => {
            this.backgroundMusic.play();
            this.backgroundMusic.volume = 0.3;
        }, { once: true });
    }

    createBackgroundKoi() {
        for (let i = 0; i < 5; i++) {
            const koi = document.createElement('div');
            koi.className = 'background-koi';
            koi.style.animationDelay = `${i * 4}s`;
            this.koiContainer.appendChild(koi);
        }
    }

    initializeEvents() {
        this.button.addEventListener('click', () => this.makeWish());
        this.shareButton.addEventListener('click', () => this.shareWishes());
    }

    createKoi() {
        const koi = document.createElement('div');
        koi.className = 'koi';
        
        // 随机颜色
        const hue = Math.random() * 360;
        koi.style.setProperty('--hue-rotate', `${hue}deg`);
        
        // 随机初始位置
        const startX = Math.random() * this.koiContainer.offsetWidth;
        koi.style.left = `${startX}px`;
        koi.style.bottom = '-50px';
        
        this.koiContainer.appendChild(koi);
        
        // 高级动画
        const jumpHeight = -300 - Math.random() * 100;
        const rotation = 45 + Math.random() * 45;
        const duration = 1500 + Math.random() * 500;
        
        const animation = koi.animate([
            { transform: 'translateY(0) rotate(0deg) scale(1)', opacity: 1 },
            { transform: `translateY(${jumpHeight}px) rotate(${rotation}deg) scale(1.2)`, opacity: 1, offset: 0.6 },
            { transform: `translateY(${jumpHeight * 1.2}px) rotate(${rotation * 1.2}deg) scale(1)`, opacity: 0 }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        });
        
        animation.onfinish = () => koi.remove();
    }

    makeWish() {
        const wishText = this.wishInput.value.trim();
        if (wishText) {
            this.wishes.unshift({
                text: wishText,
                date: new Date().toLocaleString()
            });
            this.wishes = this.wishes.slice(0, 10); // 保留最近10条
            localStorage.setItem('wishes', JSON.stringify(this.wishes));
            this.displayRecentWishes();
            this.wishInput.value = '';
        }

        this.wishCount++;
        this.updateWishCount();
        
        // 创建多条锦鲤
        for (let i = 0; i < 3; i++) {
            setTimeout(() => this.createKoi(), i * 200);
        }
        
        this.playSoundEffect();
        this.animateButton();
    }

    playSoundEffect() {
        this.splashSound.currentTime = 0;
        this.splashSound.play();
    }

    animateButton() {
        this.button.style.transform = 'translateX(-50%) scale(0.95)';
        setTimeout(() => {
            this.button.style.transform = 'translateX(-50%) scale(1)';
        }, 200);
    }

    displayRecentWishes() {
        this.wishsList.innerHTML = this.wishes
            .map(wish => `<li>
                <span>${wish.text}</span>
                <small>${wish.date}</small>
            </li>`)
            .join('');
    }

    shareWishes() {
        const shareText = `我在电子锦鲤祈福已经祈愿了${this.wishCount}次！`;
        if (navigator.share) {
            navigator.share({
                title: '电子锦鲤祈福',
                text: shareText,
                url: window.location.href
            });
        } else {
            alert(shareText + '\n\n复制这段文字分享给好友吧！');
        }
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new KoiPond();
}); 