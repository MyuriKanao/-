import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

const app = createApp({
    template: `
    <div class="container">
        <div class="pond">
            <div class="koi-container" ref="koiContainer">
                <div v-for="i in 5" :key="i" 
                     class="background-koi"
                     :style="{ animationDelay: i * 4 + 's' }">
                </div>
            </div>
            <div class="wish-panel">
                <input type="text" 
                       v-model="wishText" 
                       class="wish-input" 
                       placeholder="输入您的愿望...">
                <div class="wish-counter">
                    祈愿次数：<span>{{ wishCount }}</span>
                </div>
            </div>
            <button class="wish-button" @click="makeWish">祈愿</button>
            <button class="share-button" @click="shareWishes">分享祝福</button>
        </div>
        <div class="wishes-list">
            <h3>最近的祈愿</h3>
            <ul>
                <li v-for="(wish, index) in wishes" :key="index">
                    <span>{{ wish.text }}</span>
                    <small>{{ wish.date }}</small>
                </li>
            </ul>
        </div>
        <audio ref="splashSound" src="assets/water-splash.mp3" preload="auto"></audio>
        <audio ref="backgroundMusic" src="assets/peaceful-water.mp3" loop preload="auto"></audio>
    </div>
    `,
    data() {
        return {
            wishText: '',
            wishCount: parseInt(localStorage.getItem('wishCount')) || 0,
            wishes: JSON.parse(localStorage.getItem('wishes')) || [],
        }
    },
    mounted() {
        // 创建背景锦鲤
        for (let i = 0; i < 5; i++) {
            const koi = document.createElement('div');
            koi.className = 'background-koi';
            koi.style.animationDelay = `${i * 4}s`;
            this.$refs.koiContainer.appendChild(koi);
        }

        // 设置背景音乐
        document.addEventListener('click', () => {
            this.$refs.backgroundMusic.play();
            this.$refs.backgroundMusic.volume = 0.3;
        }, { once: true });
    },
    methods: {
        createKoi() {
            const koi = document.createElement('div');
            koi.className = 'koi';
            
            // 随机颜色
            const hue = Math.random() * 360;
            koi.style.setProperty('--hue-rotate', `${hue}deg`);
            
            // 随机初始位置
            const startX = Math.random() * this.$refs.koiContainer.offsetWidth;
            koi.style.left = `${startX}px`;
            koi.style.bottom = '-50px';
            
            this.$refs.koiContainer.appendChild(koi);
            
            // 高级动画
            const jumpHeight = -300 - Math.random() * 100;
            const rotation = 45 + Math.random() * 45;
            const duration = 1500 + Math.random() * 500;
            
            const animation = koi.animate([
                { transform: 'translateY(0) rotate(0deg) scale(1)', opacity: 1 },
                { transform: `translateY(${jumpHeight}px) rotate(${rotation}deg) scale(1.2)`, opacity: 1, offset: 0.6 },
                { transform: `translateY(${jumpHeight * 1.2}px) rotate(${rotation * 1.2}deg) scale(1)`, opacity: 0 }
            ], {
                duration,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            });
            
            animation.onfinish = () => koi.remove();
        },
        makeWish() {
            if (this.wishText.trim()) {
                this.wishes.unshift({
                    text: this.wishText,
                    date: new Date().toLocaleString()
                });
                this.wishes = this.wishes.slice(0, 10);
                localStorage.setItem('wishes', JSON.stringify(this.wishes));
                this.wishText = '';
            }

            this.wishCount++;
            localStorage.setItem('wishCount', this.wishCount);
            
            // 创建多条锦鲤
            for (let i = 0; i < 3; i++) {
                setTimeout(() => this.createKoi(), i * 200);
            }
            
            // 播放音效
            this.$refs.splashSound.currentTime = 0;
            this.$refs.splashSound.play();
        },
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
})

app.mount('#app') 